import { useState } from 'react'
import type { FormEvent } from 'react'
import { useEscapeToClose } from '../../hooks/useEscapeToClose'
import { sendChatMessage } from '../../lib/chat'
import type { ChatMessage } from '../../lib/chat'
import './ChatWidget.css'

const GREETING: ChatMessage = {
  role: 'assistant',
  content: 'Oi! Posso te ajudar a achar uma quadra ou tirar dúvidas sobre como reservar. O que você precisa?',
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEscapeToClose(() => setIsOpen(false))

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return

    const history = messages
    const nextMessages: ChatMessage[] = [...history, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')
    setIsLoading(true)

    try {
      const result = await sendChatMessage(text, history)
      setMessages((current) => [...current, { role: 'assistant', content: result.reply }])
    } catch {
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: 'Não consegui responder agora. Tenta de novo em instantes.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="chat-widget">
      {isOpen && (
        <div className="chat-widget__panel">
          <div className="chat-widget__header">
            <span>Assistente Jogaê Sports</span>
            <button onClick={() => setIsOpen(false)} aria-label="Fechar">
              ×
            </button>
          </div>

          <div className="chat-widget__messages">
            {messages.map((message, index) => (
              <div key={index} className={`chat-widget__bubble chat-widget__bubble--${message.role}`}>
                {message.content}
              </div>
            ))}
            {isLoading && <div className="chat-widget__bubble chat-widget__bubble--assistant">Digitando...</div>}
          </div>

          <form className="chat-widget__form" onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Digite sua pergunta..."
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !input.trim()}>
              Enviar
            </button>
          </form>
        </div>
      )}

      <button
        className="chat-widget__toggle"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={isOpen ? 'Fechar assistente' : 'Abrir assistente'}
      >
        {isOpen ? '×' : '💬'}
      </button>
    </div>
  )
}
