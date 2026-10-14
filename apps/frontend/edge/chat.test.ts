import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CHAT_MAX_HISTORY, CHAT_MAX_MESSAGE_LENGTH, trimHistory } from '../src/lib/chatHistory.ts'

test('trimHistory mantém só as últimas mensagens, no limite do servidor', () => {
  const history = Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? ('assistant' as const) : ('user' as const), content: `m${i}` }))
  const result = trimHistory(history)
  assert.equal(result.length, CHAT_MAX_HISTORY)
  assert.equal(result[0].content, 'm10')
  assert.equal(result[result.length - 1].content, 'm29')
})

test('trimHistory corta mensagens acima do limite e não carrega campos extras', () => {
  const [item] = trimHistory([{ role: 'assistant', content: 'x'.repeat(CHAT_MAX_MESSAGE_LENGTH + 500) }])
  assert.equal(item.content.length, CHAT_MAX_MESSAGE_LENGTH)
  assert.deepEqual(Object.keys(item).sort(), ['content', 'role'])
})
