import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { niceMax } from '../../../lib/chartMath'
import type { DayPoint } from '../../../lib/chartMath'
import { formatCurrency } from '../../../lib/money'
import './charts.css'

const PAD = { top: 16, right: 12, bottom: 28, left: 52 }

function dayLabel(date: string) {
  const [, month, day] = date.split('-')
  return `${day}/${month}`
}

function compactMoney(value: number) {
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1).replace('.', ',')} mil`
  return `R$ ${value}`
}

interface AreaChartProps {
  points: DayPoint[]
  /** Descrição curta lida por leitores de tela, ex.: "Faturamento por dia, de 01/10 a 13/10". */
  label: string
}

/** Gráfico de área do faturamento por dia, em SVG puro (sem biblioteca). Navegável por teclado. */
export default function AreaChart({ points, label }: AreaChartProps) {
  const gradientId = useId()
  const [active, setActive] = useState<number | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  // O desenho usa a largura real do cartão (1 unidade = 1 pixel), então o texto não encolhe no celular.
  const [width, setWidth] = useState(720)

  useEffect(() => {
    const node = wrapRef.current
    if (!node || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(260, Math.round(entry.contentRect.width))))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const W = width
  const H = width < 480 ? 200 : 260

  const max = niceMax(Math.max(0, ...points.map((p) => p.revenue)))
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW)
  const y = (value: number) => PAD.top + innerH - (value / max) * innerH

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(p.revenue).toFixed(1)}`).join(' ')
  const area = points.length ? `${line} L${x(points.length - 1).toFixed(1)} ${y(0)} L${x(0).toFixed(1)} ${y(0)} Z` : ''
  const ticks = [0, 0.25, 0.5, 0.75, 1]
  const labelEvery = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(innerW / 64))))

  function indexFromPointer(event: PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const px = ((event.clientX - rect.left) / rect.width) * W
    const ratio = (px - PAD.left) / innerW
    return Math.min(points.length - 1, Math.max(0, Math.round(ratio * (points.length - 1))))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!points.length) return
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      setActive((current) => Math.min(points.length - 1, (current ?? -1) + 1))
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      setActive((current) => Math.max(0, (current ?? points.length) - 1))
    } else if (event.key === 'Escape') {
      setActive(null)
    }
  }

  const current = active !== null ? points[active] : null

  return (
    <div
      ref={wrapRef}
      className="chart"
      tabIndex={0}
      role="group"
      aria-label={`${label}. Use as setas para percorrer os dias.`}
      onKeyDown={handleKeyDown}
      onBlur={() => setActive(null)}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chart__svg"
        aria-hidden="true"
        onPointerMove={(event) => points.length && setActive(indexFromPointer(event))}
        onPointerLeave={() => setActive(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line className="chart__grid" x1={PAD.left} x2={W - PAD.right} y1={y(max * t)} y2={y(max * t)} />
            <text className="chart__axis" x={PAD.left - 8} y={y(max * t) + 4} textAnchor="end">
              {compactMoney(max * t)}
            </text>
          </g>
        ))}

        {points.map((p, i) =>
          i % labelEvery === 0 || i === points.length - 1 ? (
            <text key={p.date} className="chart__axis" x={x(i)} y={H - 8} textAnchor="middle">
              {dayLabel(p.date)}
            </text>
          ) : null,
        )}

        {area && <path d={area} fill={`url(#${gradientId})`} className="chart__area" />}
        {line && <path d={line} className="chart__line" fill="none" />}

        {current && (
          <g>
            <line className="chart__cursor" x1={x(active!)} x2={x(active!)} y1={PAD.top} y2={y(0)} />
            <circle className="chart__dot" cx={x(active!)} cy={y(current.revenue)} r="5" />
          </g>
        )}
      </svg>

      {current && (
        <div
          className="chart__tooltip"
          style={{ left: `${(x(active!) / W) * 100}%` }}
          data-side={x(active!) > W * 0.65 ? 'left' : 'right'}
        >
          <span>{dayLabel(current.date)}</span>
          <strong>{formatCurrency(current.revenue)}</strong>
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {current ? `${dayLabel(current.date)}: ${formatCurrency(current.revenue)}` : ''}
      </p>
    </div>
  )
}
