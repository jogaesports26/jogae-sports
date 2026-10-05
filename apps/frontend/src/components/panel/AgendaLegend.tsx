import { Link } from 'react-router-dom'

interface AgendaLegendProps {
  pricingHref?: string
}

export default function AgendaLegend({ pricingHref }: AgendaLegendProps) {
  return (
    <div className="agenda-page__legend">
      <span className="agenda-page__legend-item">
        <span className="agenda-page__legend-swatch agenda-grid__cell--available" />
        Disponível
      </span>
      <span className="agenda-page__legend-item">
        <span className="agenda-page__legend-swatch agenda-grid__cell--reserved" />
        Reservado
      </span>
      <span className="agenda-page__legend-item">
        <span className="agenda-page__legend-swatch agenda-grid__cell--blocked" />
        Bloqueado/manutenção
      </span>
      <span className="agenda-page__legend-item">
        <span className="agenda-page__legend-swatch agenda-grid__cell--off" />
        Sem preço definido
        {pricingHref && (
          <>
            {' — '}
            <Link to={pricingHref}>configurar</Link>
          </>
        )}
      </span>
    </div>
  )
}
