export interface DayPoint {
  date: string
  revenue: number
}

function parseDay(value: string) {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatDay(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Um ponto por dia de `from` a `to`, com 0 nos dias sem faturamento (o gráfico não pula dias). */
export function fillDailySeries(from: string, to: string, daily: DayPoint[]): DayPoint[] {
  const byDate = new Map(daily.map((point) => [point.date, point.revenue]))
  const result: DayPoint[] = []
  const end = parseDay(to)
  for (let cursor = parseDay(from); cursor <= end && result.length < 1000; cursor.setDate(cursor.getDate() + 1)) {
    const date = formatDay(cursor)
    result.push({ date, revenue: byDate.get(date) ?? 0 })
  }
  return result
}

/** O período de mesmo tamanho que termina no dia anterior a `from`. */
export function previousRange(from: string, to: string): { from: string; to: string } {
  const start = parseDay(from)
  const days = Math.round((parseDay(to).getTime() - start.getTime()) / 86_400_000) + 1
  const prevEnd = new Date(start)
  prevEnd.setDate(prevEnd.getDate() - 1)
  const prevStart = new Date(prevEnd)
  prevStart.setDate(prevStart.getDate() - (days - 1))
  return { from: formatDay(prevStart), to: formatDay(prevEnd) }
}

/** Variação em %, ou null quando não há base de comparação (anterior zerado). */
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

/** Teto "redondo" do eixo (1, 2, 2,5, 5 × 10^n) que cobre o maior valor. Nunca zero. */
export function niceMax(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 100
  const exponent = Math.floor(Math.log10(value))
  const base = 10 ** exponent
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (value <= step * base) return step * base
  }
  return 10 * base
}
