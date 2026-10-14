import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildCourtChange, describeCurrent, formatMoney, sameRules } from '../src/lib/priceSummary.ts'

import type { RuleLike } from '../src/lib/priceSummary.ts'

/** Dia e noite iguais todos os dias: 06-18 a `day`, 18-23 a `night`. */
function simple(day: number | string, night: number | string): RuleLike[] {
  return Array.from({ length: 7 }, (_, d) => [
    { dayOfWeek: d, startMinute: 360, endMinute: 1080, pricePerHour: day },
    { dayOfWeek: d, startMinute: 1080, endMinute: 1380, pricePerHour: night },
  ]).flat()
}

test('formatMoney: sem centavos quando é inteiro', () => {
  assert.equal(formatMoney(80), 'R$ 80')
  assert.equal(formatMoney(82.5), 'R$ 82,50')
})

test('describeCurrent: sem regras', () => {
  assert.deepEqual(describeCurrent([]), { kind: 'none', count: 0, text: 'sem preços' })
})

test('describeCurrent: modelo de dia e noite (preço vem em texto do servidor)', () => {
  const result = describeCurrent(simple('80.00', '110.00'))
  assert.equal(result.kind, 'simple')
  assert.equal(result.text, 'dia R$ 80 · noite R$ 110')
  assert.equal(result.count, 14)
})

test('describeCurrent: uma faixa só por dia', () => {
  const one = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ dayOfWeek: d, startMinute: 360, endMinute: 1380, pricePerHour: 90 }))
  assert.equal(describeCurrent(one).text, 'R$ 90 o dia todo')
})

test('describeCurrent: dias da semana diferentes ou muitas faixas = personalizado', () => {
  const different = simple(80, 110).map((r) => (r.dayOfWeek === 3 ? { ...r, pricePerHour: 60 } : r))
  assert.equal(describeCurrent(different).kind, 'custom')
  const many = [1, 2, 3, 4, 5].flatMap((d) => [0, 1, 2].map((i) => ({ dayOfWeek: d, startMinute: 360 + i * 60, endMinute: 420 + i * 60, pricePerHour: 70 })))
  const result = describeCurrent(many)
  assert.equal(result.kind, 'custom')
  assert.match(result.text, /personalizado \(15 regras\)/)
})

test('fim de semana diferente continua sendo o modelo simples', () => {
  const weekendHigher = simple(80, 110).map((r) => (r.dayOfWeek === 0 || r.dayOfWeek === 6 ? { ...r, pricePerHour: Number(r.pricePerHour) + 20 } : r))
  assert.equal(describeCurrent(weekendHigher).kind, 'simple')
})

test('sameRules ignora a ordem e o formato do preço', () => {
  assert.equal(sameRules(simple('80.00', '110.00'), [...simple(80, 110)].reverse()), true)
  assert.equal(sameRules(simple(80, 110), simple(80, 120)), false)
})

test('buildCourtChange: nova, igual, substitui simples e substitui personalizado', () => {
  const next = simple(70, 100)
  assert.equal(buildCourtChange([], next).kind, 'new')
  assert.equal(buildCourtChange(simple(70, 100), next).kind, 'same')
  assert.equal(buildCourtChange(simple(80, 110), next).kind, 'replaces-simple')
  const custom = simple(80, 110).map((r) => (r.dayOfWeek === 3 ? { ...r, pricePerHour: 60 } : r))
  const change = buildCourtChange(custom, next)
  assert.equal(change.kind, 'replaces-custom')
  assert.equal(change.after.text, 'dia R$ 70 · noite R$ 100')
})
