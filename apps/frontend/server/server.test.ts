import assert from 'node:assert/strict'
import { spawn, type ChildProcess } from 'node:child_process'
import { createServer, type Server } from 'node:http'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, describe, it } from 'node:test'
import type { AddressInfo } from 'node:net'

const SHELL =
  '<!doctype html><html><head><title>Jogaê</title><meta property="og:title" content="x"></head><body><div id="root"></div></body></html>'
const THEME = {
  rev: 1,
  name: 'Arena Teste',
  description: 'Quadras de areia',
  coverUrl: 'https://img.test/capa.jpg',
  logoUrl: null,
  themeColor: '#0a7a3d',
  cssVars: { '--brand-primary': '#0a7a3d', '--on-brand': '#ffffff' },
}

let api: Server
let web: ChildProcess
let base = ''

async function waitFor(url: string) {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      /* ainda subindo */
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error('servidor não subiu')
}

describe('server do frontend', () => {
  before(async () => {
    api = createServer((req, res) => {
      if (req.url === '/public/estabelecimentos/arena/theme') {
        res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(THEME))
      } else if (req.url === '/public/courts/quadra1') {
        res
          .writeHead(200, { 'content-type': 'application/json' })
          .end(JSON.stringify({ name: 'Quadra 1', photoUrls: ['https://img.test/q1.jpg'] }))
      } else {
        res.writeHead(404).end()
      }
    })
    await new Promise<void>((r) => api.listen(0, '127.0.0.1', r))
    const dist = await mkdtemp(join(tmpdir(), 'jogae-dist-'))
    await mkdir(join(dist, 'assets'))
    await writeFile(join(dist, 'index.html'), SHELL)
    await writeFile(join(dist, 'assets', 'app.js'), 'console.log(1)')
    const port = 18080 + Math.floor(Math.random() * 1000)
    base = `http://127.0.0.1:${port}`
    web = spawn(process.execPath, [new URL('./server.ts', import.meta.url).pathname], {
      env: {
        ...process.env,
        PORT: String(port),
        DIST_DIR: dist,
        API_INTERNAL_URL: `http://127.0.0.1:${(api.address() as AddressInfo).port}`,
      },
      stdio: 'ignore',
    })
    await waitFor(`${base}/healthz`)
  })

  after(() => {
    web?.kill()
    api?.close()
  })

  it('reescreve o <head> da lojinha com título e imagem de compartilhamento', async () => {
    const html = await (await fetch(`${base}/arena`)).text()
    assert.match(html, /Arena Teste/)
    assert.match(html, /https:\/\/img\.test\/capa\.jpg/)
  })

  it('usa nome e foto da quadra em /:slug/:courtId', async () => {
    const html = await (await fetch(`${base}/arena/quadra1`)).text()
    assert.match(html, /Quadra 1 · Arena Teste/)
    assert.match(html, /https:\/\/img\.test\/q1\.jpg/)
  })

  it('slug inexistente responde 404 com o shell do SPA', async () => {
    const response = await fetch(`${base}/naoexiste`)
    assert.equal(response.status, 404)
    assert.match(await response.text(), /id="root"/)
  })

  it('serve manifest e ícone da lojinha', async () => {
    const manifest = await fetch(`${base}/arena/manifest.webmanifest`)
    assert.equal(manifest.status, 200)
    assert.match(manifest.headers.get('content-type') ?? '', /manifest\+json/)
    const icon = await fetch(`${base}/arena/icon.svg`)
    assert.match(icon.headers.get('content-type') ?? '', /svg/)
  })

  it('libera o iframe só em /:slug/embed', async () => {
    const embed = await fetch(`${base}/arena/embed`)
    assert.equal(embed.headers.get('content-security-policy'), 'frame-ancestors *;')
    assert.equal((await fetch(`${base}/arena/embed/quadra1`)).headers.get('content-security-policy'), 'frame-ancestors *;')
    assert.equal((await fetch(`${base}/arena`)).headers.get('content-security-policy'), null)
  })

  it('rotas reservadas e desconhecidas caem no shell sem consultar a API', async () => {
    const html = await (await fetch(`${base}/login`)).text()
    assert.equal(html, SHELL)
  })

  it('serve assets e bloqueia path traversal', async () => {
    const asset = await fetch(`${base}/assets/app.js`)
    assert.equal(asset.status, 200)
    assert.match(asset.headers.get('cache-control') ?? '', /immutable/)
    const traversal = await fetch(`${base}/assets/..%2f..%2fetc%2fpasswd`)
    assert.equal(traversal.status, 404)
    assert.equal((await fetch(`${base}/assets/nao-existe.js`)).status, 404)
  })

  it('só aceita GET e HEAD', async () => {
    assert.equal((await fetch(`${base}/arena`, { method: 'POST' })).status, 405)
  })
})
