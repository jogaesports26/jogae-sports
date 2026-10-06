/**
 * Manifest PWA e ícone por lojinha, gerados pelo Edge Middleware (../middleware.ts).
 * Ficam na mesma origem do app (exigência da instalação). Funções puras, testáveis com node --test.
 */

// Sem import de ./head: o bundler da Vercel não aceita extensão .ts, e o node --test não resolve import sem ela.
const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export interface ManifestInput {
  slug: string
  name: string
  themeColor: string
  logoUrl?: string | null
}

const HEX = /^#[0-9a-f]{6}$/i

/** Cor só passa se for #rrggbb; qualquer outra coisa cai no valor de reserva (nunca vai solta pra dentro do SVG). */
export function safeColor(value: string | undefined, fallback: string): string {
  return value && HEX.test(value) ? value : fallback
}

export function buildManifest({ slug, name, themeColor, logoUrl }: ManifestInput) {
  const base = `/${encodeURIComponent(slug)}`
  const shortName = name.length > 12 ? `${name.slice(0, 11).trimEnd()}…` : name
  const icons: Array<Record<string, string>> = []
  if (logoUrl && /^https?:\/\//i.test(logoUrl)) {
    icons.push({ src: logoUrl, sizes: '512x512', purpose: 'any' })
  }
  icons.push({ src: `${base}/icon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' })

  return {
    name,
    short_name: shortName,
    description: `Reserve quadras em ${name}`,
    start_url: `${base}?source=pwa`,
    scope: `${base}/`,
    display: 'standalone',
    orientation: 'portrait',
    lang: 'pt-BR',
    theme_color: themeColor,
    background_color: '#ffffff',
    icons,
  }
}

/** Monograma (inicial do nome) sobre a cor da marca; ícone padrão quando o dono não tem logo. */
export function monogramSvg(name: string, background: string, foreground: string): string {
  const letter = escapeHtml((name.trim().charAt(0) || 'J').toUpperCase())
  const bg = safeColor(background, '#013ff6')
  const fg = safeColor(foreground, '#ffffff')
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">` +
    `<rect width="512" height="512" fill="${bg}"/>` +
    `<text x="256" y="256" text-anchor="middle" dominant-baseline="central" ` +
    `font-family="Inter, system-ui, sans-serif" font-size="280" font-weight="700" fill="${fg}">${letter}</text>` +
    `</svg>`
  )
}
