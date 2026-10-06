import { Outlet, useParams, useSearchParams } from 'react-router-dom'
import { useStoreTheme } from '../../lib/theme'
import './EmbedLayout.css'

// Parâmetros aceitos na URL do iframe; o servidor valida o formato de cada um (400 se inválido).
const THEME_PARAMS = ['primary', 'action', 'radius', 'font'] as const

export default function EmbedLayout() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()

  const overrides = new URLSearchParams()
  THEME_PARAMS.forEach((key) => {
    const value = searchParams.get(key)
    if (value) overrides.set(key, value)
  })
  const auto = searchParams.get('theme') === 'auto'
  // Sem ?theme=auto nem parâmetros, o embed segue neutro (tema Jogaê), como sempre foi.
  useStoreTheme(slug, { enabled: auto || overrides.size > 0, query: overrides.toString() })

  return (
    <div className="embed-layout">
      <div className="embed-layout__content">
        <Outlet context={{ basePath: `/${slug}/embed` }} />
      </div>
      <a href={`/${slug}`} target="_blank" rel="noreferrer" className="embed-layout__footer">
        Feito com Jogaê Sports
      </a>
    </div>
  )
}
