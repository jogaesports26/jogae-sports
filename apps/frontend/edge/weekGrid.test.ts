import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isSlotInPast, slotStartsAt, startsNotInPast } from '../src/lib/slotTime.ts'

const tuesday = new Date(2026, 9, 13) // 13/10/2026
const wednesday = new Date(2026, 9, 14)
const at = (day: Date, hour: number, minute = 0) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute)
const hourly = Array.from({ length: 17 }, (_, i) => (6 + i) * 60) // 06:00 a 22:00
const halfHourly = Array.from({ length: 34 }, (_, i) => 360 + i * 30)

test('slotStartsAt monta o instante do horário no dia', () => {
  assert.equal(slotStartsAt(tuesday, 21 * 60 + 30).getTime(), at(tuesday, 21, 30).getTime())
})

test('isSlotInPast: antes de agora é passado; no instante exato também; depois não', () => {
  const now = at(tuesday, 21, 0)
  assert.equal(isSlotInPast(tuesday, 20 * 60, now), true)
  assert.equal(isSlotInPast(tuesday, 21 * 60, now), true)
  assert.equal(isSlotInPast(tuesday, 21 * 60 + 30, now), false)
  assert.equal(isSlotInPast(wednesday, 6 * 60, now), false)
})

test('startsNotInPast: às 21:00 só sobra 22:00 (horário cheio)', () => {
  assert.deepEqual(startsNotInPast(hourly, tuesday, at(tuesday, 21, 0)), [22 * 60])
})

test('startsNotInPast: passo de 30 minutos, 20:45 oferece de 21:00 em diante', () => {
  assert.deepEqual(startsNotInPast(halfHourly, tuesday, at(tuesday, 20, 45)).slice(0, 3), [21 * 60, 21 * 60 + 30, 22 * 60])
})

test('virada do dia: de noite hoje não sobra nada e amanhã tudo continua oferecido', () => {
  const now = at(tuesday, 23, 30)
  assert.deepEqual(startsNotInPast(hourly, tuesday, now), [])
  assert.equal(startsNotInPast(hourly, wednesday, now).length, hourly.length)
})

test('dia que já passou não oferece nada', () => {
  assert.deepEqual(startsNotInPast(hourly, tuesday, at(wednesday, 8, 0)), [])
})
