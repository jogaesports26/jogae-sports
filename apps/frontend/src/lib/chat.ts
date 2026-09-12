import { API_URL, parseApiError } from './api'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  reply: string
  configured: boolean
}

export async function sendChatMessage(message: string, history: ChatMessage[]): Promise<ChatResponse> {
  const response = await fetch(`${API_URL}/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível falar com o assistente'))
  }
  return response.json()
}
