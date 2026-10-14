export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/** Limites do servidor (chat/dto/send-message.dto.ts): mais que isso é recusado com 400. */
export const CHAT_MAX_MESSAGE_LENGTH = 2000
export const CHAT_MAX_HISTORY = 20

/** Só as últimas mensagens, cada uma dentro do limite: uma conversa longa não pode virar erro 400. */
export function trimHistory(history: ChatMessage[]): ChatMessage[] {
  return history
    .slice(-CHAT_MAX_HISTORY)
    .map((item) => ({ role: item.role, content: item.content.slice(0, CHAT_MAX_MESSAGE_LENGTH) }))
}
