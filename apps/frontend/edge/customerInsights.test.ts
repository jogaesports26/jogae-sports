import assert from 'node:assert/strict'
import { test } from 'node:test'
import { averageTicket, customerInsights, whatsappLink } from '../src/lib/customerInsights.ts'

const r = (startsAt: string, status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW', court: string) => ({
  startsAt,
  status,
  court: { name: court },
})

test('ficha: cliente desde, quadra favorita (sem canceladas) e contagens', () => {
  const result = customerInsights([
    r('2026-09-10T10:00:00Z', 'COMPLETED', 'Quadra 1'),
    r('2026-08-01T10:00:00Z', 'COMPLETED', 'Quadra 2'),
    r('2026-09-20T10:00:00Z', 'CANCELLED', 'Quadra 2'),
    r('2026-09-25T10:00:00Z', 'CANCELLED', 'Quadra 2'),
    r('2026-10-01T10:00:00Z', 'NO_SHOW', 'Quadra 1'),
  ])
  assert.equal(result.firstAt, '2026-08-01T10:00:00Z')
  assert.equal(result.favoriteCourt, 'Quadra 1')
  assert.equal(result.completed, 2)
  assert.equal(result.cancelled, 2)
  assert.equal(result.noShows, 1)
})

test('ficha sem reservas não quebra', () => {
  assert.deepEqual(customerInsights([]), {
    firstAt: null,
    favoriteCourt: null,
    completed: 0,
    cancelled: 0,
    noShows: 0,
  })
})

test('ticket médio e link do WhatsApp', () => {
  assert.equal(averageTicket(1230, 9), 1230 / 9)
  assert.equal(averageTicket(0, 0), 0)
  assert.equal(whatsappLink('(11) 98888-0001'), 'https://wa.me/5511988880001')
  assert.equal(whatsappLink('123'), null)
})
