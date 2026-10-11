import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildLaneItems } from '../src/lib/dayGridRuns.ts'

import type { LaneState } from '../src/lib/dayGridRuns.ts'

type S = LaneState<{ id: string }>
const res = (id: string): S => ({ kind: 'reserved', reservation: { id } })
const free: S = { kind: 'available' }
const off: S = { kind: 'noPrice' }
const blocked: S = { kind: 'blocked' }

test('junta horas seguidas da mesma reserva num bloco só', () => {
  const items = buildLaneItems([free, res('a'), res('a'), free])
  assert.deepEqual(
    items.map((i) => [i.kind, i.start, i.span]),
    [['available', 0, 1], ['reserved', 1, 2], ['available', 3, 1]],
  )
})

test('reservas diferentes em sequência continuam separadas', () => {
  const items = buildLaneItems([res('a'), res('b')])
  assert.deepEqual(items.map((i) => [i.kind, i.start, i.span]), [['reserved', 0, 1], ['reserved', 1, 1]])
})

test('manutenção seguida vira um bloco, e horas sem preço ficam separadas', () => {
  const items = buildLaneItems([blocked, blocked, blocked, off, off])
  assert.deepEqual(
    items.map((i) => [i.kind, i.start, i.span]),
    [['blocked', 0, 3], ['noPrice', 3, 1], ['noPrice', 4, 1]],
  )
})

test('lista vazia não gera blocos', () => {
  assert.deepEqual(buildLaneItems([]), [])
})
