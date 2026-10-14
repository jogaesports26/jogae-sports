import assert from 'node:assert/strict'
import { test } from 'node:test'
import { groupFullHours } from '../src/lib/slotGrouping.ts'

const at = (...mins: number[]) => mins.map((startMinute) => ({ startMinute }))
const HALF_HOURS = at(360, 390, 420, 450, 480) // 06:00 06:30 07:00 07:30 08:00

test('passo de 30 min: por padrão só as horas cheias, e conta o que ficou de fora', () => {
  const result = groupFullHours(HALF_HOURS, 30, false)
  assert.deepEqual(result.listed.map((s) => s.startMinute), [360, 420, 480])
  assert.equal(result.hiddenCount, 2)
  assert.equal(result.canToggle, true)
})

test('"ver todos" mostra tudo', () => {
  const result = groupFullHours(HALF_HOURS, 30, true)
  assert.equal(result.listed.length, 5)
  assert.equal(result.hiddenCount, 0)
  assert.equal(result.canToggle, true)
})

test('passo de 60 min ou mais: nada a agrupar', () => {
  const result = groupFullHours(at(360, 420, 480), 60, false)
  assert.equal(result.canToggle, false)
  assert.equal(result.listed.length, 3)
})

test('o horário escolhido nunca some, mesmo intermediário', () => {
  const result = groupFullHours(HALF_HOURS, 30, false, (s) => s.startMinute === 450)
  assert.deepEqual(result.listed.map((s) => s.startMinute), [360, 420, 450, 480])
  assert.equal(result.hiddenCount, 1)
})

test('se só sobrassem intermediários, mostra tudo (lista nunca vazia)', () => {
  const result = groupFullHours(at(390, 450), 30, false)
  assert.equal(result.listed.length, 2)
  assert.equal(result.canToggle, false)
})

test('sem horários, sem erro', () => {
  assert.deepEqual(groupFullHours([], 30, false), { listed: [], hiddenCount: 0, canToggle: false })
})
