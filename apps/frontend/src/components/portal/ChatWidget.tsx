import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useEscapeToClose } from '../../hooks/useEscapeToClose'
import { CHAT_MAX_MESSAGE_LENGTH, ChatError, sendChatMessage } from '../../lib/chat'
import type { ChatMessage } from '../../lib/chat'
import './ChatWidget.css'

const GREETING: ChatMessage = {
  role: 'assistant',
  content: 'Oi! Posso te ajudar a achar uma quadra ou tirar dúvidas sobre como reservar. O que você precisa?',
}

const SUGGESTIONS = ['Quais quadras vocês têm?', 'Como faço uma reserva?', 'Qual o horário de funcionamento?']

/** Mensagem na tela: além do texto, diz se a pergunta do cliente chegou. */
interface UiMessage extends ChatMessage {
  id: number
  status?: 'failed'
  /** Aviso do próprio chat (ex.: "Não consegui responder"): aparece na tela, mas nunca vai para o servidor como histórico. */
  local?: boolean
}

let nextId = 1
const makeMessage = (role: ChatMessage['role'], content: string, local = false): UiMessage => ({
  id: nextId++,
  role,
  content,
  local,
})

function errorText(error: unknown) {
  if (error instanceof ChatError && error.status === 429) {
    return 'Muitas mensagens seguidas. Espere um minutinho e tente de novo.'
  }
  return 'Não consegui responder agora.'
}

interface ChatWidgetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Com a barra de abas visível (mobile), o botão flutuante some e o chat abre pela aba "Assistente". */
  tabbed?: boolean
  /** No mobile, esconde o botão flutuante (o assistente abre por outro controle). */
  hideToggleOnMobile?: boolean
}

export default function ChatWidget({ open, onOpenChange, tabbed = false, hideToggleOnMobile = false }: ChatWidgetProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = open ?? internalOpen
  const setIsOpen = onOpenChange ?? setInternalOpen
  const [messages, setMessages] = useState<UiMessage[]>(() => [{ ...GREETING, id: 0 }])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [unseen, setUnseen] = useState(false)
  const logRef = useRef<HTMLDivElement | null>(null)
  const atBottomRef = useRef(true)
  // A rolagem suave dispara eventos de scroll no meio do caminho: durante ela, não se conclui que a pessoa saiu do fim.
  const programmaticUntilRef = useRef(0)

  useEscapeToClose(() => setIsOpen(false))

  const scrollToEnd = useCallback((smooth = true) => {
    const node = logRef.current
    if (!node) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const animated = smooth && !reduce
    if (animated) programmaticUntilRef.current = Date.now() + 700
    node.scrollTo({ top: node.scrollHeight, behavior: animated ? 'smooth' : 'auto' })
    setUnseen(false)
  }, [])

  function handleScroll() {
    const node = logRef.current
    if (!node || Date.now() < programmaticUntilRef.current) return
    atBottomRef.current = node.scrollHeight - node.scrollTop - node.clientHeight < 40
    if (atBottomRef.current) setUnseen(false)
  }

  // Rola sozinho só se a pessoa já estava no fim; se ela subiu para reler, avisa em vez de puxar de volta.
  useEffect(() => {
    if (!isOpen) return
    if (atBottomRef.current) scrollToEnd()
    else setUnseen(true)
  }, [messages, isLoading, isOpen, scrollToEnd])

  useEffect(() => {
    if (isOpen) {
      atBottomRef.current = true
      scrollToEnd(false)
    }
  }, [isOpen, scrollToEnd])

  async function ask(text: string, retryId?: number) {
    const clean = text.trim()
    if (!clean || isLoading) return

    const current = retryId === undefined ? messages : messages.filter((m) => m.id !== retryId)
    const history = current.filter((m) => m.status !== 'failed' && !m.local && m.id !== 0)
    const question = makeMessage('user', clean)
    atBottomRef.current = true
    setMessages([...current, question])
    setInput('')
    setIsLoading(true)

    try {
      const result = await sendChatMessage(clean, history)
      setMessages((list) => [...list, makeMessage('assistant', result.reply)])
    } catch (error) {
      setMessages((list) => [
        ...list.map((m) => (m.id === question.id ? { ...m, status: 'failed' as const } : m)),
        makeMessage('assistant', errorText(error), true),
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void ask(input)
  }

  function resetConversation() {
    setMessages([{ ...GREETING, id: 0 }])
    setInput('')
    setUnseen(false)
    atBottomRef.current = true
  }

  const onlyGreeting = messages.length === 1

  return (
    <div className={`chat-widget${tabbed ? ' chat-widget--tabbed' : ''}${hideToggleOnMobile ? ' chat-widget--no-toggle' : ''}`}>
      {isOpen && (
        <div className="chat-widget__panel" role="dialog" aria-label="Assistente Jogaê">
          <div className="chat-widget__header">
            <span className="chat-widget__avatar chat-widget__avatar--header" aria-hidden="true">J</span>
            <span className="chat-widget__title">
              <strong>Assistente Jogaê</strong>
              <small>Tira dúvidas e ajuda a achar quadra</small>
            </span>
            <button type="button" onClick={resetConversation} aria-label="Nova conversa" title="Nova conversa" disabled={onlyGreeting && !isLoading}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Fechar">
              ×
            </button>
          </div>

          <div className="chat-widget__body">
            <div
              ref={logRef}
              className="chat-widget__messages"
              role="log"
              aria-relevant="additions"
              aria-busy={isLoading}
              aria-label="Conversa com o assistente"
              tabIndex={0}
              onScroll={handleScroll}
            >
              {messages.map((message, index) => {
                const previous = messages[index - 1]
                const next = messages[index + 1]
                const joinedAbove = previous?.role === message.role
                const joinedBelow = next?.role === message.role
                return (
                  <div
                    key={message.id}
                    className={`chat-widget__row chat-widget__row--${message.role}${joinedAbove ? ' chat-widget__row--joined' : ''}`}
                  >
                    {message.role === 'assistant' && (
                      <span className={`chat-widget__avatar${joinedBelow ? ' chat-widget__avatar--hidden' : ''}`} aria-hidden="true">J</span>
                    )}
                    <div className="chat-widget__stack">
                      <div
                        className={`chat-widget__bubble chat-widget__bubble--${message.role}${joinedAbove ? ' chat-widget__bubble--join-top' : ''}${joinedBelow ? ' chat-widget__bubble--join-bottom' : ''}`}
                      >
                        {message.content}
                      </div>
                      {message.status === 'failed' && (
                        <span className="chat-widget__failed">
                          Não enviada.{' '}
                          <button type="button" onClick={() => void ask(message.content, message.id)} disabled={isLoading}>
                            Tentar de novo
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}

              {onlyGreeting && !isLoading && (
                <div className="chat-widget__suggestions" aria-label="Sugestões de pergunta">
                  {SUGGESTIONS.map((suggestion) => (
                    <button key={suggestion} type="button" onClick={() => void ask(suggestion)}>
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {isLoading && (
                <div className="chat-widget__row chat-widget__row--assistant" role="status">
                  <span className="chat-widget__avatar" aria-hidden="true">J</span>
                  <div className="chat-widget__bubble chat-widget__bubble--assistant chat-widget__typing">
                    <span className="chat-widget__dot" aria-hidden="true" />
                    <span className="chat-widget__dot" aria-hidden="true" />
                    <span className="chat-widget__dot" aria-hidden="true" />
                    <span className="sr-only">O assistente está digitando…</span>
                  </div>
                </div>
              )}
            </div>

            {unseen && (
              <button type="button" className="chat-widget__newest" onClick={() => scrollToEnd()}>
                Ir para a mensagem mais nova
              </button>
            )}
          </div>

          <form className="chat-widget__form" onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Digite sua pergunta..."
              aria-label="Sua pergunta"
              maxLength={CHAT_MAX_MESSAGE_LENGTH}
              autoComplete="off"
            />
            <button type="submit" className="chat-widget__send" disabled={isLoading || !input.trim()} aria-label="Enviar">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 19V6m0 0-5 5m5-5 5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>
      )}

      <button
        className="chat-widget__toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Fechar assistente' : 'Abrir assistente'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          '×'
        ) : (
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A1.5 1.5 0 0 1 4 14.5v-9Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path d="M8.5 9.5h7M8.5 12.5h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </div>
  )
}
