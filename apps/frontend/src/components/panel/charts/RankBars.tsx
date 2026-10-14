import { formatCurrency } from '../../../lib/money'
import './charts.css'

export interface RankItem {
  id: string
  label: string
  detail: string
  value: number
}

/** Ranking em barras horizontais (quadras, cupons, equipamentos): nome, detalhe e valor sempre em texto. */
export default function RankBars({ items }: { items: RankItem[] }) {
  const max = Math.max(1, ...items.map((item) => item.value))
  return (
    <ol className="rank">
      {items.map((item) => (
        <li key={item.id} className="rank__row">
          <span className="rank__head">
            <span className="rank__name">{item.label}</span>
            <span className="rank__detail">{item.detail}</span>
            <strong className="rank__value">{formatCurrency(item.value)}</strong>
          </span>
          <span className="rank__track" aria-hidden="true">
            <span className="rank__fill" style={{ width: `${Math.max(item.value > 0 ? 3 : 0, (item.value / max) * 100)}%` }} />
          </span>
        </li>
      ))}
    </ol>
  )
}
