import type { PriceRule } from './courts'
import type { MaintenanceBlock, Reservation } from './reservations'

export const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0')
  const m = (minutes % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

export function toDateInputValue(date: Date) {
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Sunday of the week containing `date`, at local midnight. */
export function startOfWeek(date: Date) {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  result.setDate(result.getDate() - result.getDay())
  return result
}

export function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export interface GridRow {
  key: string
  startMinute: number
  endMinute: number
}

/** Union of every distinct (start,end) block across all days, sorted — the row axis of the grid. */
export function buildGridRows(priceRules: PriceRule[]): GridRow[] {
  const seen = new Map<string, GridRow>()
  for (const rule of priceRules) {
    const key = `${rule.startMinute}-${rule.endMinute}`
    if (!seen.has(key)) {
      seen.set(key, { key, startMinute: rule.startMinute, endMinute: rule.endMinute })
    }
  }
  return [...seen.values()].sort((a, b) => a.startMinute - b.startMinute)
}

export interface CellOccupant {
  type: 'reservation' | 'block'
  reservation?: Reservation
  block?: MaintenanceBlock
}

function rangeOverlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart
}

export function findOccupant(
  dayDate: Date,
  startMinute: number,
  endMinute: number,
  reservations: Reservation[],
  blocks: MaintenanceBlock[],
): CellOccupant | null {
  const cellStart = new Date(dayDate)
  cellStart.setMinutes(startMinute)
  const cellEnd = new Date(dayDate)
  cellEnd.setMinutes(endMinute)

  const reservation = reservations.find(
    (r) => r.status !== 'CANCELLED' && rangeOverlaps(new Date(r.startsAt), new Date(r.endsAt), cellStart, cellEnd),
  )
  if (reservation) return { type: 'reservation', reservation }

  const block = blocks.find((b) => rangeOverlaps(new Date(b.startsAt), new Date(b.endsAt), cellStart, cellEnd))
  if (block) return { type: 'block', block }

  return null
}

/**
 * Valid contiguous end-minutes a reservation could stop at, starting from `startMinute`
 * on the given day — walks the day's price-rule chain until a gap or an occupied block.
 */
export function getBookableEndOptions(
  dayOfWeek: number,
  startMinute: number,
  priceRules: PriceRule[],
  dayDate: Date,
  reservations: Reservation[],
  blocks: MaintenanceBlock[],
): number[] {
  const dayRules = priceRules
    .filter((r) => r.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.startMinute - b.startMinute)

  const options: number[] = []
  let cursor = startMinute

  while (true) {
    const rule = dayRules.find((r) => r.startMinute === cursor)
    if (!rule) break

    const occupant = findOccupant(dayDate, rule.startMinute, rule.endMinute, reservations, blocks)
    if (occupant) break

    cursor = rule.endMinute
    options.push(cursor)
  }

  return options
}
