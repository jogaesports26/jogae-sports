import type { PriceRule, RecurringMaintenanceBlock } from './courts'
import type { MaintenanceBlock, Reservation } from './reservations'

export const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

/** "90" -> "1h30min", "60" -> "1h", "30" -> "30min". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return `${hours}h${rest ? `${rest}min` : ''}`
}

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
  type: 'reservation' | 'block' | 'recurringBlock'
  reservation?: Reservation
  block?: MaintenanceBlock
  recurringBlock?: RecurringMaintenanceBlock
}

function rangeOverlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart
}

function minutesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && aEnd > bStart
}

export function findOccupant(
  dayDate: Date,
  startMinute: number,
  endMinute: number,
  reservations: Reservation[],
  blocks: MaintenanceBlock[],
  recurringBlocks: RecurringMaintenanceBlock[] = [],
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

  const dayOfWeek = dayDate.getDay()
  const recurringBlock = recurringBlocks.find(
    (b) => b.dayOfWeek === dayOfWeek && minutesOverlap(b.startMinute, b.endMinute, startMinute, endMinute),
  )
  if (recurringBlock) return { type: 'recurringBlock', recurringBlock }

  return null
}

/** Soma o preço de um intervalo contíguo de regras de preço, igual ao cálculo do backend. */
export function sumPriceForRange(
  dayOfWeek: number,
  startMinute: number,
  endMinute: number,
  priceRules: PriceRule[],
): number | null {
  const dayRules = priceRules
    .filter((r) => r.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.startMinute - b.startMinute)

  let cursor = startMinute
  let total = 0

  while (cursor < endMinute) {
    const rule = dayRules.find((r) => r.startMinute === cursor)
    if (!rule) return null

    const segmentEnd = Math.min(rule.endMinute, endMinute)
    total += Number(rule.pricePerHour) * ((segmentEnd - cursor) / 60)
    cursor = rule.endMinute
  }

  return cursor === endMinute ? Math.round(total * 100) / 100 : null
}

/**
 * Horários de início disponíveis num dia pra uma duração específica — cada início candidato
 * é o startMinute de alguma regra de preço daquele dia; um início é válido se existir uma
 * cadeia contígua de regras livres cobrindo exatamente `durationMinutes` a partir dali.
 */
export function getAvailableStartTimes(
  dayOfWeek: number,
  durationMinutes: number,
  priceRules: PriceRule[],
  dayDate: Date,
  reservations: Reservation[],
  blocks: MaintenanceBlock[],
  recurringBlocks: RecurringMaintenanceBlock[] = [],
): number[] {
  const candidateStarts = [...new Set(priceRules.filter((r) => r.dayOfWeek === dayOfWeek).map((r) => r.startMinute))]

  return candidateStarts
    .filter((start) => {
      const endOptions = getBookableEndOptions(
        dayOfWeek,
        start,
        priceRules,
        dayDate,
        reservations,
        blocks,
        recurringBlocks,
      )
      return endOptions.includes(start + durationMinutes)
    })
    .sort((a, b) => a - b)
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
  recurringBlocks: RecurringMaintenanceBlock[] = [],
): number[] {
  const dayRules = priceRules
    .filter((r) => r.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.startMinute - b.startMinute)

  const options: number[] = []
  let cursor = startMinute

  while (true) {
    const rule = dayRules.find((r) => r.startMinute === cursor)
    if (!rule) break

    const occupant = findOccupant(dayDate, rule.startMinute, rule.endMinute, reservations, blocks, recurringBlocks)
    if (occupant) break

    cursor = rule.endMinute
    options.push(cursor)
  }

  return options
}
