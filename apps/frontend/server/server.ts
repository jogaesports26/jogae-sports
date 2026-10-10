/**
 * Servidor do frontend (roda na VPS dentro da imagem jogae-web).
 *
 * Entrega o `dist` do Vite e, nas rotas da lojinha (/:slug e /:slug/:courtId), reescreve o
 * <head> com título, Open Graph e tema do dono, igual a ../middleware.ts. Também serve
 * /:slug/manifest.webmanifest e /:slug/icon.svg e libera o iframe em /:slug/embed.
 * Sem dependências: só Node. Variáveis: PORT (8080), API_INTERNAL_URL (http://jogae-api:3000), DIST_DIR.
 */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderHead, truncate } from '../edge/head.ts'
import { buildManifest, monogramSvg } from '../edge/manifest.ts'

const PORT = Number(process.env.PORT ?? 8080)
const API_URL = (process.env.API_INTERNAL_URL ?? 'http://jogae-api:3000').replace(/\/$/, '')
const DIST = resolve(process.env.DIST_DIR ?? fileURLToPath(new URL('../dist', import.meta.url)))
const TIMEOUT_MS = 2500
const THEME_TTL_MS = 30_000
const THEME_CACHE_MAX = 500

// Manter em sync com App.tsx e backend/src/common/reserved-slugs.ts.
const RESERVED = new Set([
  'login', 'cadastro', 'esqueci-senha', 'redefinir-senha', 'painel',
  'minhas-reservas', 'termos', 'privacidade', 'api', 'assets', 'admin', 'health', 'healthz',
])
const SLUG = /^[a-z0-9][a-z0-9-]{0,79}$/
const COURT_ID = /^[A-Za-z0-9-]{1,64}$/

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.map': 'application/json',
}

interface ThemeResponse {
  rev: number
  name: string | null
  description: string | null
  coverUrl: string | null
  logoUrl: string | null
  themeColor: string
  cssVars: Record<string, string>
  cssVarsDark?: Record<string, string>
}
interface CourtResponse {
  name: string
  photoUrls: string[]
}
interface Reply {
  status: number
  headers: Record<string, string>
  body: string | Buffer
}

const themeCache = new Map<string, { at: number; status: number; data: ThemeResponse | null }>()

async function getJson<T>(path: string): Promise<{ status: number; data: T | null }> {
  const response = await fetch(`${API_URL}${path}`, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  return { status: response.status, data: response.ok ? ((await response.json()) as T) : null }
}

async function getTheme(slug: string) {
  const hit = themeCache.get(slug)
  if (hit && Date.now() - hit.at < THEME_TTL_MS) return hit
  const result = await getJson<ThemeResponse>(`/public/estabelecimentos/${encodeURIComponent(slug)}/theme`)
  if (result.status === 404 || result.data) {
    if (themeCache.size >= THEME_CACHE_MAX) themeCache.clear()
    const entry = { at: Date.now(), ...result }
    themeCache.set(slug, entry)
    return entry
  }
  return result
}

/** Só imagem por link; data URL (base64) é grande demais pra og:image e muitos crawlers ignoram. */
const linkImage = (value: string | null | undefined) => (value && /^https?:\/\//i.test(value) ? value : null)

const NOT_FOUND: Reply = { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' }, body: 'Not found' }

async function storeAsset(slug: string, file: 'manifest.webmanifest' | 'icon.svg'): Promise<Reply | undefined> {
  try {
    const theme = await getTheme(slug)
    if (theme.status === 404) return NOT_FOUND
    if (!theme.data) return undefined
    const store = theme.data
    const name = store.name ?? 'Jogaê Sports'
    const cache = 'public, max-age=300'
    if (file === 'icon.svg') {
      const svg = monogramSvg(name, store.cssVars['--brand-primary'], store.cssVars['--on-brand'])
      return { status: 200, headers: { 'content-type': 'image/svg+xml', 'cache-control': cache }, body: svg }
    }
    const manifest = buildManifest({ slug, name, themeColor: store.themeColor, logoUrl: store.logoUrl })
    return {
      status: 200,
      headers: { 'content-type': 'application/manifest+json', 'cache-control': cache },
      body: JSON.stringify(manifest),
    }
  } catch {
    return undefined
  }
}

async function storePage(url: URL, slug: string, second: string | undefined, shell: string): Promise<Reply | undefined> {
  try {
    const theme = await getTheme(slug)
    if (theme.status === 404) {
      return { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' }, body: shell }
    }
    if (!theme.data) return undefined
    const store = theme.data
    const storeName = store.name ?? 'Jogaê Sports'
    let title = `${storeName} · Reserve sua quadra`
    let description = truncate(
      store.description ?? `Veja os horários livres e reserve sua quadra em ${storeName}, direto pelo celular.`,
      200,
    )
    let image = linkImage(store.coverUrl) ?? linkImage(store.logoUrl)

    if (second && COURT_ID.test(second)) {
      const court = await getJson<CourtResponse>(`/public/courts/${encodeURIComponent(second)}`).catch(() => null)
      if (court?.data) {
        title = `${court.data.name} · ${storeName}`
        description = `Reserve a ${court.data.name} em ${storeName}. Horários livres e confirmação na hora.`
        image = linkImage(court.data.photoUrls[0]) ?? image
      }
    }

    const body = renderHead(shell, {
      title,
      description,
      url: url.href,
      image,
      themeColor: store.themeColor,
      cssVars: store.cssVars,
      cssVarsDark: store.cssVarsDark,
      bootstrap: { slug, theme: store },
      manifestHref: `/${encodeURIComponent(slug)}/manifest.webmanifest`,
    })
    return {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=0, must-revalidate' },
      body,
    }
  } catch {
    return undefined
  }
}

async function readStatic(pathname: string): Promise<Reply | null> {
  let decoded: string
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    return null
  }
  const file = normalize(join(DIST, decoded))
  if (file !== DIST && !file.startsWith(DIST + sep)) return null
  try {
    if (!(await stat(file)).isFile()) return null
    const immutable = decoded.startsWith('/assets/')
    return {
      status: 200,
      headers: {
        'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
        'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
      },
      body: await readFile(file),
    }
  } catch {
    return null
  }
}

async function handle(method: string, rawUrl: string, shell: string): Promise<Reply> {
  const url = new URL(rawUrl, 'http://localhost')
  const parts = url.pathname.split('/').filter(Boolean)
  const [slug, second, third] = parts

  if (url.pathname === '/healthz') {
    return { status: 200, headers: { 'content-type': 'application/json' }, body: '{"status":"ok"}' }
  }

  // Arquivos estáticos (têm ponto ou ficam em /assets), exceto manifest e ícone dinâmicos da lojinha.
  const isStoreAsset = parts.length === 2 && (second === 'manifest.webmanifest' || second === 'icon.svg')
  if ((url.pathname.includes('.') || slug === 'assets') && !isStoreAsset) {
    return (await readStatic(url.pathname)) ?? NOT_FOUND
  }

  const embed = second === 'embed'
  const isStoreRoute = !!slug && SLUG.test(slug) && !RESERVED.has(slug) && parts.length <= 3
  let reply: Reply | undefined

  if (isStoreRoute && isStoreAsset) {
    reply = await storeAsset(slug, second)
  } else if (isStoreRoute && !embed && parts.length <= 2 && (method === 'GET' || method === 'HEAD')) {
    reply = await storePage(url, slug, second, shell)
  }

  reply ??= { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' }, body: shell }

  // O iframe do widget (/:slug/embed e /:slug/embed/:courtId) precisa poder ser incorporado em qualquer site.
  if (isStoreRoute && embed && parts.length <= 3 && (third === undefined || COURT_ID.test(third))) {
    reply.headers['content-security-policy'] = 'frame-ancestors *;'
  }
  return reply
}

const shell = await readFile(join(DIST, 'index.html'), 'utf8')

createServer((req, res) => {
  const method = req.method ?? 'GET'
  if (method !== 'GET' && method !== 'HEAD') {
    res.writeHead(405, { allow: 'GET, HEAD' }).end()
    return
  }
  handle(method, req.url ?? '/', shell)
    .catch((): Reply => ({ status: 500, headers: { 'content-type': 'text/plain' }, body: 'Internal error' }))
    .then((reply) => {
      const headers = { 'x-content-type-options': 'nosniff', ...reply.headers }
      res.writeHead(reply.status, { ...headers, 'content-length': Buffer.byteLength(reply.body) })
      res.end(method === 'HEAD' ? undefined : reply.body)
    })
}).listen(PORT, () => console.log(`jogae-web ouvindo em :${PORT} (API ${API_URL})`))
