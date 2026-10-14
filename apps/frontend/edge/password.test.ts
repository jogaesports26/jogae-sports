import assert from 'node:assert/strict'
import { test } from 'node:test'
import { passwordStrength, weakPasswordReason } from '../src/lib/password.ts'

test('weakPasswordReason segue as mesmas regras do servidor', () => {
  assert.match(weakPasswordReason('abc123') ?? '', /pelo menos 8/)
  assert.match(weakPasswordReason('Senha123') ?? '', /muito comum/)
  assert.match(weakPasswordReason('aaaaaaaa') ?? '', /repetir/)
  assert.match(weakPasswordReason('48201937') ?? '', /só números/)
  assert.match(weakPasswordReason('a1'.repeat(37)) ?? '', /no máximo 72/)
  assert.equal(weakPasswordReason('quadra-azul-47'), null)
})

test('passwordStrength: 0 para vazia ou recusada, sobe com tamanho e variedade', () => {
  assert.equal(passwordStrength(''), 0)
  assert.equal(passwordStrength('senha123'), 0)
  assert.equal(passwordStrength('quadra1x'), 1)
  assert.ok(passwordStrength('Quadra-azul-47') >= 3)
  assert.equal(passwordStrength('Quadra-azul-47-forte!'), 4)
})
