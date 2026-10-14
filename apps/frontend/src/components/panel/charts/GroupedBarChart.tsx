import { niceMax } from '../../../lib/chartMath'
import { formatCurrency } from '../../../lib/money'
import './charts.css'

export interface GroupedBarItem {
  label: string
  current: number
  previous: number
}

interface GroupedBarChartProps {
  items: GroupedBarItem[]
  currentLabel: string
  previousLabel: string
}

/** Barras agrupadas por quadra: período atual (azul) ao lado do anterior (cinza). Valores em texto, sem depender só de cor. */
export default function GroupedBarChart({ items, currentLabel, previousLabel }: GroupedBarChartProps) {
  const max = niceMax(Math.max(0, ...items.flatMap((item) => [item.current, item.previous])))
  const pct = (value: number) => `${Math.max(value > 0 ? 3 : 0, (value / max) * 100)}%`

  return (
    <div className="gbars">
      <ul className="gbars__legend" aria-hidden="true">
        <li><span className="gbars__swatch gbars__swatch--current" /> {currentLabel}</li>
        <li><span className="gbars__swatch gbars__swatch--previous" /> {previousLabel}</li>
      </ul>
      <ul className="gbars__list">
        {items.map((item) => (
          <li key={item.label} className="gbars__row">
            <span className="gbars__name">{item.label}</span>
            <span className="gbars__bars">
              <span className="gbars__track">
                <span className="gbars__bar gbars__bar--current" style={{ width: pct(item.current) }} />
                <span className="gbars__value">
                  <span className="sr-only">{currentLabel}: </span>
                  {formatCurrency(item.current)}
                </span>
              </span>
              <span className="gbars__track">
                <span className="gbars__bar gbars__bar--previous" style={{ width: pct(item.previous) }} />
                <span className="gbars__value gbars__value--muted">
                  <span className="sr-only">{previousLabel}: </span>
                  {formatCurrency(item.previous)}
                </span>
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
