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

/**
 * Soma o preço de um intervalo [startMinute, endMinute), igual ao cálculo do backend.
 * O intervalo pode começar/terminar no meio de uma regra de preço — não precisa coincidir
 * com as fronteiras salvas — desde que exista cobertura contígua de regras até endMinute.
 * Retorna null se houver um buraco (trecho sem regra de preço) no meio do intervalo.
 */
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
    const rule = dayRules.find((r) => r.startMinute <= cursor && r.endMinute > cursor)
    if (!rule) return null

    const segmentEnd = Math.min(rule.endMinute, endMinute)
    total += Number(rule.pricePerHour) * ((segmentEnd - cursor) / 60)
    cursor = segmentEnd
  }

  return Math.round(total * 100) / 100
}

/** Um intervalo [startMinute, endMinute) tem preço definido e está livre de ocupantes. */
export function isSlotAvailable(
  dayOfWeek: number,
  startMinute: number,
  endMinute: number,
  priceRules: PriceRule[],
  dayDate: Date,
  reservations: Reservation[],
  blocks: MaintenanceBlock[],
  recurringBlocks: RecurringMaintenanceBlock[] = [],
): boolean {
  if (sumPriceForRange(dayOfWeek, startMinute, endMinute, priceRules) === null) return false
  return !findOccupant(dayDate, startMinute, endMinute, reservations, blocks, recurringBlocks)
}

/**
 * Horários de início disponíveis num dia pra uma duração específica. Os candidatos são
 * gerados no passo `bookingStepMinutes` — a granularidade de reserva configurada pelo dono,
 * independente de como as regras de preço foram cadastradas — cobrindo toda a janela coberta
 * por alguma regra de preço naquele dia.
 */
export function getAvailableStartTimes(
  dayOfWeek: number,
  durationMinutes: number,
  bookingStepMinutes: number,
  priceRules: PriceRule[],
  dayDate: Date,
  reservations: Reservation[],
  blocks: MaintenanceBlock[],
  recurringBlocks: RecurringMaintenanceBlock[] = [],
): number[] {
  const dayRules = priceRules.filter((r) => r.dayOfWeek === dayOfWeek)
  if (dayRules.length === 0) return []

  const dayStart = Math.min(...dayRules.map((r) => r.startMinute))
  const dayEnd = Math.max(...dayRules.map((r) => r.endMinute))

  const starts: number[] = []
  for (let start = dayStart; start + durationMinutes <= dayEnd; start += bookingStepMinutes) {
    if (isSlotAvailable(dayOfWeek, start, start + durationMinutes, priceRules, dayDate, reservations, blocks, recurringBlocks)) {
      starts.push(start)
    }
  }
  return starts
}

/**
 * Grade de horários candidatos num dia, no passo `bookingStepMinutes`, cobrindo toda a
 * janela definida pelas regras de preço — usada pra renderizar as opções na tela de reserva.
 */
export function getDayStepGrid(dayOfWeek: number, bookingStepMinutes: number, priceRules: PriceRule[]): number[] {
  const dayRules = priceRules.filter((r) => r.dayOfWeek === dayOfWeek)
  if (dayRules.length === 0) return []

  const dayStart = Math.min(...dayRules.map((r) => r.startMinute))
  const dayEnd = Math.max(...dayRules.map((r) => r.endMinute))

  const cells: number[] = []
  for (let start = dayStart; start < dayEnd; start += bookingStepMinutes) {
    cells.push(start)
  }
  return cells
}

/**
 * Fins de reserva válidos a partir de `startMinute`, no passo `bookingStepMinutes` — usada
 * pelo dono pra escolher uma duração livre ao lançar uma reserva manual na agenda.
 */
export function getBookableEndOptions(
  dayOfWeek: number,
  startMinute: number,
  bookingStepMinutes: number,
  priceRules: PriceRule[],
  dayDate: Date,
  reservations: Reservation[],
  blocks: MaintenanceBlock[],
  recurringBlocks: RecurringMaintenanceBlock[] = [],
): number[] {
  const dayRules = priceRules.filter((r) => r.dayOfWeek === dayOfWeek)
  if (dayRules.length === 0) return []

  const dayEnd = Math.max(...dayRules.map((r) => r.endMinute))

  const options: number[] = []
  for (let end = startMinute + bookingStepMinutes; end <= dayEnd; end += bookingStepMinutes) {
    if (!isSlotAvailable(dayOfWeek, startMinute, end, priceRules, dayDate, reservations, blocks, recurringBlocks)) break
    options.push(end)
  }
  return options
}
