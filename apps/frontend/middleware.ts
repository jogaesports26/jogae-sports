/**
 * Vercel Edge Middleware das rotas da lojinha (/:slug e /:slug/:courtId).
 *
 * O HTML do SPA é igual pra todo mundo; WhatsApp/Google não executam JS, então o link
 * de uma lojinha saía sem nome, foto ou descrição, e o tema do dono só aparecia depois
 * do carregamento (flash da cor errada). Aqui o <head> é reescrito por lojinha com:
 * título, description, Open Graph, theme-color e as variáveis CSS do tema.
 * Slug inexistente responde 404 de verdade. Qualquer falha aqui deixa a requisição
 * seguir normalmente (o SPA continua funcionando, só sem a otimização).
 */
import { renderHead, truncate } from './edge/head'
import { buildManifest, monogramSvg } from './edge/manifest'

export const config = {
  // Ignora arquivos estáticos (com ponto) e a API; as rotas fixas do app são filtradas abaixo.
  matcher: ['/((?!api/|assets/|.*\\..*).*)', '/:slug/manifest.webmanifest', '/:slug/icon.svg'],
}

const RESERVED = new Set(['login', 'cadastro', 'esqueci-senha', 'redefinir-senha', 'painel', 'minhas-reservas', 'termos', 'privacidade'])
// `process` não é tipado no runtime Edge da Vercel; lê pelo globalThis.
const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
const API_URL = env?.VITE_API_URL ?? 'https://jogae-sports-backend.onrender.com'
const TIMEOUT_MS = 2500

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
  owner: { establishmentName: string | null }
}

async function getJson<T>(path: string): Promise<{ status: number; data: T | null }> {
  const response = await fetch(`${API_URL}${path}`, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  return { status: response.status, data: response.ok ? ((await response.json()) as T) : null }
}

/** Só imagem por link; data URL (base64) é grande demais pra og:image e muitos crawlers ignoram. */
const linkImage = (value: string | null | undefined) => (value && /^https?:\/\//i.test(value) ? value : null)

async function storeAsset(slug: string, file: 'manifest.webmanifest' | 'icon.svg'): Promise<Response | undefined> {
  try {
    const theme = await getJson<ThemeResponse>(`/public/estabelecimentos/${encodeURIComponent(slug)}/theme`)
    if (theme.status === 404) return new Response('Not found', { status: 404 })
    if (!theme.data) return undefined
    const store = theme.data
    const name = store.name ?? 'Jogaê Sports'
    const cache = 'public, s-maxage=300, stale-while-revalidate=3600'

    if (file === 'icon.svg') {
      const svg = monogramSvg(name, store.cssVars['--brand-primary'], store.cssVars['--on-brand'])
      return new Response(svg, { headers: { 'content-type': 'image/svg+xml', 'cache-control': cache } })
    }
    const manifest = buildManifest({ slug, name, themeColor: store.themeColor, logoUrl: store.logoUrl })
    return new Response(JSON.stringify(manifest), {
      headers: { 'content-type': 'application/manifest+json', 'cache-control': cache },
    })
  } catch {
    return undefined
  }
}

export default async function middleware(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url)
  const [slug, second] = url.pathname.split('/').filter(Boolean)

  if (slug && (second === 'manifest.webmanifest' || second === 'icon.svg')) {
    return storeAsset(slug, second)
  }
  // O embed (iframe no site do cliente) não leva tema do dono por padrão: só com ?theme=auto, resolvido no navegador.
  if (!slug || RESERVED.has(slug) || second === 'embed') return undefined

  try {
    const theme = await getJson<ThemeResponse>(`/public/estabelecimentos/${encodeURIComponent(slug)}/theme`)
    const shell = await fetch(new URL('/index.html', url))
    const html = await shell.text()

    if (theme.status === 404) {
      return new Response(html, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } })
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

    if (second && second !== 'embed') {
      const court = await getJson<CourtResponse>(`/public/courts/${encodeURIComponent(second)}`).catch(() => null)
      if (court?.data) {
        title = `${court.data.name} · ${storeName}`
        description = `Reserve a ${court.data.name} em ${storeName}. Horários livres e confirmação na hora.`
        image = linkImage(court.data.photoUrls[0]) ?? image
      }
    }

    const body = renderHead(html, {
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
    return new Response(body, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch {
    return undefined
  }
}
