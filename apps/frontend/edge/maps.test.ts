import assert from 'node:assert/strict'
import { test } from 'node:test'
import { directionsUrl } from '../src/lib/maps.ts'

test('directionsUrl monta a rota do Google Maps com o endereço codificado', () => {
  assert.equal(
    directionsUrl('Rua das Palmeiras, 450 - São Paulo/SP'),
    'https://www.google.com/maps/dir/?api=1&destination=Rua%20das%20Palmeiras%2C%20450%20-%20S%C3%A3o%20Paulo%2FSP',
  )
})

test('directionsUrl não gera link sem endereço', () => {
  assert.equal(directionsUrl(null), null)
  assert.equal(directionsUrl(undefined), null)
  assert.equal(directionsUrl('   '), null)
})
