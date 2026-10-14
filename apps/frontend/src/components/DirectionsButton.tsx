import { directionsUrl } from '../lib/maps'
import './DirectionsButton.css'

interface DirectionsButtonProps {
  address: string | null | undefined
  /** "onBrand" sobre a faixa colorida do topo; "default" sobre fundo neutro. */
  variant?: 'onBrand' | 'default'
}

/** Botão "Como chegar": abre a rota no Google Maps em outra aba. Nada do Google é carregado na página; só abre ao clicar. */
export default function DirectionsButton({ address, variant = 'default' }: DirectionsButtonProps) {
  const href = directionsUrl(address)
  if (!href) return null

  return (
    <a
      className={`directions-button directions-button--${variant}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Como chegar (abre o Google Maps em outra aba)"
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m3 11 18-8-8 18-2-8-8-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
      Como chegar
    </a>
  )
}
