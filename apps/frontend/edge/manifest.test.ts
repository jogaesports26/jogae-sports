import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildManifest, monogramSvg, safeColor } from './manifest.ts'

test('manifest usa nome, escopo e cor da lojinha', () => {
  const manifest = buildManifest({ slug: 'arena-sol', name: 'Arena Sol Esportes Ltda', themeColor: '#0b7a3b' })
  assert.equal(manifest.name, 'Arena Sol Esportes Ltda')
  assert.equal(manifest.short_name.length <= 12, true)
  assert.equal(manifest.start_url, '/arena-sol?source=pwa')
  assert.equal(manifest.scope, '/arena-sol/')
  assert.equal(manifest.theme_color, '#0b7a3b')
  assert.equal(manifest.display, 'standalone')
})

test('logo por link vem antes do monograma; data URL é ignorada', () => {
  const withLogo = buildManifest({ slug: 'a', name: 'A', themeColor: '#000000', logoUrl: 'https://x.test/logo.png' })
  assert.equal(withLogo.icons[0].src, 'https://x.test/logo.png')
  assert.equal(withLogo.icons.at(-1)?.src, '/a/icon.svg')

  const withData = buildManifest({ slug: 'a', name: 'A', themeColor: '#000000', logoUrl: 'data:image/png;base64,AAAA' })
  assert.equal(withData.icons.length, 1)
  assert.equal(withData.icons[0].src, '/a/icon.svg')
})

test('monograma escapa o nome e só aceita cor #rrggbb', () => {
  const svg = monogramSvg('<script>', '#0b7a3b', 'red" onload="x')
  assert.doesNotMatch(svg, /<script>/)
  assert.match(svg, /&lt;/)
  assert.match(svg, /fill="#ffffff"/)
  assert.match(svg, /fill="#0b7a3b"/)
})

test('safeColor', () => {
  assert.equal(safeColor('#ABCDEF', '#000000'), '#ABCDEF')
  assert.equal(safeColor('url(x)', '#000000'), '#000000')
  assert.equal(safeColor(undefined, '#000000'), '#000000')
})
