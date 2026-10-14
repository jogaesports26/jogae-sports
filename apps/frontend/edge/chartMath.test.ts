import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fillDailySeries, niceMax, percentChange, previousRange } from '../src/lib/chartMath.ts'

test('fillDailySeries completa os dias sem faturamento com zero', () => {
  const result = fillDailySeries('2026-10-01', '2026-10-04', [{ date: '2026-10-02', revenue: 80 }])
  assert.deepEqual(result, [
    { date: '2026-10-01', revenue: 0 },
    { date: '2026-10-02', revenue: 80 },
    { date: '2026-10-03', revenue: 0 },
    { date: '2026-10-04', revenue: 0 },
  ])
})

test('fillDailySeries atravessa a virada de mês e de ano', () => {
  const result = fillDailySeries('2026-12-30', '2027-01-02', [])
  assert.deepEqual(result.map((p) => p.date), ['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02'])
})

test('previousRange devolve o período de mesmo tamanho logo antes', () => {
  assert.deepEqual(previousRange('2026-10-08', '2026-10-14'), { from: '2026-10-01', to: '2026-10-07' })
  assert.deepEqual(previousRange('2026-10-13', '2026-10-13'), { from: '2026-10-12', to: '2026-10-12' })
  assert.deepEqual(previousRange('2026-10-01', '2026-10-13'), { from: '2026-09-18', to: '2026-09-30' })
})

test('percentChange não inventa porcentagem sem base', () => {
  assert.equal(percentChange(150, 100), 50)
  assert.equal(percentChange(50, 100), -50)
  assert.equal(percentChange(100, 0), null)
})

test('niceMax devolve um teto redondo e nunca zero', () => {
  assert.equal(niceMax(0), 100)
  assert.equal(niceMax(87), 100)
  assert.equal(niceMax(101), 200)
  assert.equal(niceMax(230), 250)
  assert.equal(niceMax(4570), 5000)
})
