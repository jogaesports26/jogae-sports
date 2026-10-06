import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cssVarsToStyle, escapeHtml, renderHead, truncate } from './head.ts'

const SHELL = `<!doctype html>
<html><head>
  <title>Jogaê Sports · Reserva de quadras</title>
  <meta name="description" content="padrão" />
  <meta name="theme-color" content="#013ff6" />
  <meta property="og:title" content="padrão" />
</head><body></body></html>`

test('reescreve título, descrição, og e theme-color e injeta tema', () => {
  const html = renderHead(SHELL, {
    title: 'Arena Sol · Reserve sua quadra',
    description: 'Quadras no centro',
    url: 'https://x.test/arena-sol',
    image: 'https://x.test/capa.jpg',
    themeColor: '#0b7a3b',
    cssVars: { '--brand-primary': '#0b7a3b' },
    bootstrap: { slug: 'arena-sol' },
  })
  assert.match(html, /<title>Arena Sol · Reserve sua quadra<\/title>/)
  assert.match(html, /name="theme-color" content="#0b7a3b"/)
  assert.match(html, /property="og:image" content="https:\/\/x\.test\/capa\.jpg"/)
  assert.match(html, /property="og:url"/)
  assert.match(html, /<style id="jogae-theme">:root\{--brand-primary:#0b7a3b\}<\/style>/)
  assert.match(html, /window\.__JOGAE_THEME__=\{"slug":"arena-sol"\}/)
  assert.doesNotMatch(html, /content="padrão"/)
})

test('escapa HTML em título e descrição (nome do dono é entrada do usuário)', () => {
  const html = renderHead(SHELL, {
    title: '"><script>alert(1)</script>',
    description: 'a & b',
    url: 'https://x.test/',
  })
  assert.doesNotMatch(html, /<script>alert/)
  assert.match(html, /a &amp; b/)
})

test('bootstrap não deixa fechar o <script> com </script>', () => {
  const html = renderHead(SHELL, {
    title: 't',
    description: 'd',
    url: 'https://x.test/',
    bootstrap: { name: '</script><img src=x onerror=alert(1)>' },
  })
  assert.doesNotMatch(html, /<\/script><img/)
})

test('só aceita variáveis CSS com nome e valor seguros', () => {
  const style = cssVarsToStyle({
    '--brand-primary': '#013ff6',
    '--font-body': "'Inter', system-ui, sans-serif",
    '--evil': 'red;}</style><script>',
    'color': 'red',
  })
  assert.equal(style, ":root{--brand-primary:#013ff6;--font-body:'Inter', system-ui, sans-serif}")
})

test('truncate e escapeHtml', () => {
  assert.equal(truncate('a  b\n c', 50), 'a b c')
  assert.equal(truncate('x'.repeat(30), 10).length, 10)
  assert.equal(escapeHtml('<&">'), '&lt;&amp;&quot;&gt;')
})
