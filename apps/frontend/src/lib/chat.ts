import { API_URL, parseApiError } from './api'
import { CHAT_MAX_HISTORY, CHAT_MAX_MESSAGE_LENGTH, trimHistory } from './chatHistory'
import type { ChatMessage } from './chatHistory'

export { CHAT_MAX_HISTORY, CHAT_MAX_MESSAGE_LENGTH, trimHistory }
export type { ChatMessage }

export interface ChatResponse {
  reply: string
  configured: boolean
}

export class ChatError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  slug?: string | null,
): Promise<ChatResponse> {
  const response = await fetch(`${API_URL}/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history: trimHistory(history), slug: slug || undefined }),
  })
  if (!response.ok) {
    throw new ChatError(await parseApiError(response, 'Não foi possível falar com o assistente'), response.status)
  }
  return response.json()
}
