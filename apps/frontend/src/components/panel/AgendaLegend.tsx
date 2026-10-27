import { Link } from 'react-router-dom'
import './DayGrid.css'

interface AgendaLegendProps {
  pricingHref?: string
}

/** Mesmas amostras da grade do dia: cada uma repete o estilo da célula que representa. */
export default function AgendaLegend({ pricingHref }: AgendaLegendProps) {
  return (
    <ul className="day-grid__legend agenda-page__legend" aria-label="Legenda">
      <li><i className="day-grid__swatch day-grid__swatch--reserved" />Reservado</li>
      <li><i className="day-grid__swatch day-grid__swatch--free" />Livre</li>
      <li><i className="day-grid__swatch day-grid__swatch--blocked" />Manutenção</li>
      <li>
        <i className="day-grid__swatch day-grid__swatch--off" />
        Sem preço
        {pricingHref && <Link to={pricingHref}>configurar</Link>}
      </li>
    </ul>
  )
}
