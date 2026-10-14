/** Regra de preço em forma simples (serve tanto para as que vêm do servidor, com o preço em texto, quanto para as novas). */
export interface RuleLike {
  dayOfWeek: number
  startMinute: number
  endMinute: number
  pricePerHour: number | string
}

export type CurrentKind = 'none' | 'simple' | 'custom'

export interface CurrentPricing {
  kind: CurrentKind
  /** Quantas regras a quadra tem hoje. */
  count: number
  /** Frase curta: "dia R$ 80 · noite R$ 110", "personalizado (14 regras)" ou "sem preços". */
  text: string
}

export type ChangeKind = 'new' | 'same' | 'replaces-simple' | 'replaces-custom'

export interface CourtChange {
  before: CurrentPricing
  after: CurrentPricing
  kind: ChangeKind
}

export function formatMoney(value: number): string {
  return Number.isInteger(value) ? `R$ ${value}` : `R$ ${value.toFixed(2).replace('.', ',')}`
}

const num = (value: number | string) => Number(value)

function priceAt(rules: RuleLike[], dayOfWeek: number, minute: number): number | null {
  const rule = rules.find((r) => r.dayOfWeek === dayOfWeek && r.startMinute <= minute && minute < r.endMinute)
  return rule ? num(rule.pricePerHour) : null
}

/** A mesma lista de regras, em ordem fixa, para comparar. */
function canonical(rules: RuleLike[]): string {
  return JSON.stringify(
    rules
      .map((r) => [r.dayOfWeek, r.startMinute, r.endMinute, num(r.pricePerHour)])
      .sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]),
  )
}

export function sameRules(a: RuleLike[], b: RuleLike[]): boolean {
  return canonical(a) === canonical(b)
}

/**
 * Resume os preços que a quadra tem hoje. "Simples" = de segunda a sexta iguais e no máximo duas faixas por dia
 * (o modelo de dia e noite); qualquer outra coisa conta como personalizado e perde o detalhe ao ser substituída.
 */
export function describeCurrent(rules: RuleLike[]): CurrentPricing {
  if (rules.length === 0) return { kind: 'none', count: 0, text: 'sem preços' }

  const perDay = (day: number) => rules.filter((r) => r.dayOfWeek === day)
  const signature = (day: number) =>
    JSON.stringify(
      perDay(day)
        .map((r) => [r.startMinute, r.endMinute, num(r.pricePerHour)])
        .sort((a, b) => a[0] - b[0]),
    )
  const weekdaysEqual = [2, 3, 4, 5].every((day) => signature(day) === signature(1))
  const fewBands = [0, 1, 2, 3, 4, 5, 6].every((day) => perDay(day).length <= 2)

  if (!weekdaysEqual || !fewBands || perDay(1).length === 0) {
    return { kind: 'custom', count: rules.length, text: `personalizado (${rules.length} ${rules.length === 1 ? 'regra' : 'regras'})` }
  }

  const bands = perDay(1).sort((a, b) => a.startMinute - b.startMinute)
  const text =
    bands.length === 1
      ? `${formatMoney(num(bands[0].pricePerHour))} o dia todo`
      : `dia ${formatMoney(num(bands[0].pricePerHour))} · noite ${formatMoney(num(bands[1].pricePerHour))}`
  return { kind: 'simple', count: rules.length, text }
}

/** O que muda numa quadra ao trocar as regras atuais pelas novas. */
export function buildCourtChange(current: RuleLike[], next: RuleLike[]): CourtChange {
  const before = describeCurrent(current)
  const after = describeCurrent(next)
  let kind: ChangeKind
  if (before.kind === 'none') kind = 'new'
  else if (sameRules(current, next)) kind = 'same'
  else kind = before.kind === 'custom' ? 'replaces-custom' : 'replaces-simple'
  return { before, after, kind }
}

export { priceAt }
