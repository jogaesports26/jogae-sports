import assert from 'node:assert/strict'
import { test } from 'node:test'
import { describeOpeningHours } from '../src/lib/openingHours.ts'

import type { HoursRule } from '../src/lib/openingHours.ts'

const rule = (dayOfWeek: number, startMinute: number, endMinute: number): HoursRule => ({ dayOfWeek, startMinute, endMinute })

test('sem regras, sem horário', () => {
  assert.deepEqual(describeOpeningHours([]), [])
})

test('todos os dias iguais viram uma linha só', () => {
  const rules = [0, 1, 2, 3, 4, 5, 6].map((d) => rule(d, 360, 1380))
  assert.deepEqual(describeOpeningHours(rules), [{ days: 'Seg a Dom', hours: '6h às 23h' }])
})

test('semana e fim de semana diferentes', () => {
  const rules = [1, 2, 3, 4, 5].map((d) => rule(d, 360, 1380)).concat([rule(6, 420, 1380), rule(0, 420, 1320)])
  assert.deepEqual(describeOpeningHours(rules), [
    { days: 'Seg a Sex', hours: '6h às 23h' },
    { days: 'Sáb', hours: '7h às 23h' },
    { days: 'Dom', hours: '7h às 22h' },
  ])
})

test('dia sem regra aparece como fechado e dois dias seguidos viram "e"', () => {
  const rules = [1, 2, 3, 4, 5].map((d) => rule(d, 480, 1200))
  assert.deepEqual(describeOpeningHours(rules), [
    { days: 'Seg a Sex', hours: '8h às 20h' },
    { days: 'Sáb e Dom', hours: 'Fechado' },
  ])
})

test('várias faixas no dia: da primeira abertura ao último fechamento; meia hora aparece', () => {
  const rules = [1, 2, 3, 4, 5, 6, 0].flatMap((d) => [rule(d, 390, 1080), rule(d, 1080, 1380)])
  assert.deepEqual(describeOpeningHours(rules), [{ days: 'Seg a Dom', hours: '6h30 às 23h' }])
})
