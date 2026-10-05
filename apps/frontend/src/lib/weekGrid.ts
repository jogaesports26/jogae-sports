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
  startMinute: number
  endMinute: number
}

/** Janela padrão da grade da Agenda quando a quadra não tem preço/bloqueio fora dela. */
export const AGENDA_DEFAULT_START_MINUTE = 6 * 60
export const AGENDA_DEFAULT_END_MINUTE = 23 * 60
export const AGENDA_ROW_STEP_MINUTES = 60

/**
 * Grade de horas cheias da Agenda, independente de preço — cada hora do dia vira uma linha,
 * exista ou não regra de preço cadastrada pra ela (ver `getAgendaCellState` pra decidir o
 * estado de cada célula). A janela padrão é 06:00–23:00, ampliada automaticamente se algum
 * preço ou bloqueio recorrente da quadra cair fora dela, pra nunca esconder dado real.
 */
export function buildAgendaGridRows(priceRules: PriceRule[], recurringBlocks: RecurringMaintenanceBlock[]): GridRow[] {
  let rangeStart = AGENDA_DEFAULT_START_MINUTE
  let rangeEnd = AGENDA_DEFAULT_END_MINUTE

  for (const rule of priceRules) {
    rangeStart = Math.min(rangeStart, rule.startMinute)
    rangeEnd = Math.max(rangeEnd, rule.endMinute)
  }
  for (const block of recurringBlocks) {
    rangeStart = Math.min(rangeStart, block.startMinute)
    rangeEnd = Math.max(rangeEnd, block.endMinute)
  }

  rangeStart = Math.floor(rangeStart / AGENDA_ROW_STEP_MINUTES) * AGENDA_ROW_STEP_MINUTES
  rangeEnd = Math.ceil(rangeEnd / AGENDA_ROW_STEP_MINUTES) * AGENDA_ROW_STEP_MINUTES

  const rows: GridRow[] = []
  for (let start = rangeStart; start < rangeEnd; start += AGENDA_ROW_STEP_MINUTES) {
    rows.push({ startMinute: start, endMinute: start + AGENDA_ROW_STEP_MINUTES })
  }
  return rows
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

export type AgendaCellState =
  | { kind: 'reserved'; reservation: Reservation; isLabelRow: boolean }
  | { kind: 'blocked' }
  | { kind: 'available' }
  | { kind: 'noPrice' }

/**
 * Estado de uma célula da grade (dia x hora cheia) da Agenda. Ocupante (reserva/bloqueio)
 * e preço são checados como duas camadas independentes — uma reserva ou bloqueio aparece
 * mesmo numa hora sem preço cadastrado, em vez de sumir da grade como acontecia antes.
 */
export function getAgendaCellState(
  dayOfWeek: number,
  row: GridRow,
  priceRules: PriceRule[],
  dayDate: Date,
  reservations: Reservation[],
  blocks: MaintenanceBlock[],
  recurringBlocks: RecurringMaintenanceBlock[],
): AgendaCellState {
  const occupant = findOccupant(dayDate, row.startMinute, row.endMinute, reservations, blocks, recurringBlocks)

  if (occupant?.type === 'reservation' && occupant.reservation) {
    const start = new Date(occupant.reservation.startsAt)
    const startMinuteOfDay = start.getHours() * 60 + start.getMinutes()
    const isLabelRow = startMinuteOfDay >= row.startMinute && startMinuteOfDay < row.endMinute
    return { kind: 'reserved', reservation: occupant.reservation, isLabelRow }
  }

  if (occupant?.type === 'block' || occupant?.type === 'recurringBlock') {
    return { kind: 'blocked' }
  }

  const hasPrice = sumPriceForRange(dayOfWeek, row.startMinute, row.endMinute, priceRules) !== null
  return hasPrice ? { kind: 'available' } : { kind: 'noPrice' }
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
