/**
 * Variantes responsivas (srcset) das fotos de quadra.
 * Só dá pra pedir tamanhos diferentes quando a imagem vem de um CDN que redimensiona por URL
 * (hoje, as fotos de demonstração do Unsplash). Fotos enviadas pelo dono já são redimensionadas
 * no navegador antes do upload (lib/imageUpload.ts) e ficam como estão.
 */
const SRCSET_WIDTHS = [480, 800, 1200]

export function photoSrcSet(url: string): string | undefined {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return undefined
  }
  if (parsed.hostname !== 'images.unsplash.com') return undefined

  const baseWidth = Number(parsed.searchParams.get('w'))
  const baseHeight = Number(parsed.searchParams.get('h'))
  return SRCSET_WIDTHS.map((width) => {
    const variant = new URL(parsed)
    variant.searchParams.set('w', String(width))
    if (baseWidth > 0 && baseHeight > 0) variant.searchParams.set('h', String(Math.round((baseHeight * width) / baseWidth)))
    return `${variant.toString()} ${width}w`
  }).join(', ')
}

/** Largura que a foto ocupa: tela inteira no celular, metade do contêiner no desktop. */
export const PHOTO_SIZES = '(min-width: 960px) 560px, 100vw'
