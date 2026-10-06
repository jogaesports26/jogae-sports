/**
 * Reescrita do <head> do index.html pelo Edge Middleware (../middleware.ts).
 * Funções puras, sem dependência de runtime, pra rodar no Edge e nos testes (node --test).
 */

export interface HeadData {
  title: string
  description: string
  url: string
  image?: string | null
  themeColor?: string | null
  /** Variáveis CSS de tema já validadas pelo backend; entram num <style> no HTML inicial (sem flash). */
  cssVars?: Record<string, string>
  /** Objeto exposto em window.__JOGAE_THEME__ pro frontend começar com o tema certo. */
  bootstrap?: unknown
}

const LINE_SEPARATORS = new RegExp('[\\u2028\\u2029]', 'g')
const CSS_NAME = /^--[a-z0-9-]+$/
// Só caracteres que aparecem em cores, medidas e pilhas de fonte; barra qualquer coisa que feche o <style>.
const CSS_VALUE = /^[#\w\s,.'()%-]+$/

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function truncate(value: string, max: number): string {
  const clean = value.replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean
}

export function cssVarsToStyle(vars: Record<string, string>): string {
  const declarations = Object.entries(vars)
    .filter(([name, value]) => CSS_NAME.test(name) && CSS_VALUE.test(value))
    .map(([name, value]) => `${name}:${value}`)
    .join(';')
  return `:root{${declarations}}`
}

function setMeta(html: string, attr: 'name' | 'property', key: string, content: string): string {
  const tag = `<meta ${attr}="${key}" content="${escapeHtml(content)}" />`
  const existing = new RegExp(`<meta\\s+${attr}="${key}"[^>]*>`, 'i')
  return existing.test(html) ? html.replace(existing, tag) : html.replace('</head>', `    ${tag}\n  </head>`)
}

export function renderHead(html: string, data: HeadData): string {
  let out = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(data.title)}</title>`)
  out = setMeta(out, 'name', 'description', data.description)
  if (data.themeColor) out = setMeta(out, 'name', 'theme-color', data.themeColor)
  out = setMeta(out, 'property', 'og:title', data.title)
  out = setMeta(out, 'property', 'og:description', data.description)
  out = setMeta(out, 'property', 'og:url', data.url)
  if (data.image) {
    out = setMeta(out, 'property', 'og:image', data.image)
    out = setMeta(out, 'name', 'twitter:card', 'summary_large_image')
    out = setMeta(out, 'name', 'twitter:image', data.image)
  }

  const injected: string[] = []
  if (data.cssVars) injected.push(`<style id="jogae-theme">${cssVarsToStyle(data.cssVars)}</style>`)
  if (data.bootstrap !== undefined) {
    const json = JSON.stringify(data.bootstrap).replace(/</g, '\\u003c').replace(LINE_SEPARATORS, '')
    injected.push(`<script>window.__JOGAE_THEME__=${json}</script>`)
  }
  return injected.length ? out.replace('</head>', `    ${injected.join('\n    ')}\n  </head>`) : out
}
