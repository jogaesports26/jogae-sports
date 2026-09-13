import { authFetch, parseApiError } from './api'

export interface OwnerReview {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  ownerReply: string | null
  ownerRepliedAt: string | null
  court: { id: string; name: string }
  player: { name: string | null }
}

export async function fetchOwnerReviews(): Promise<OwnerReview[]> {
  const response = await authFetch('/reviews')
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível carregar as avaliações'))
  }
  return response.json()
}

export async function replyToReview(id: string, reply: string): Promise<OwnerReview> {
  const response = await authFetch(`/reviews/${id}/reply`, {
    method: 'PATCH',
    body: JSON.stringify({ reply }),
  })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível salvar a resposta'))
  }
  return response.json()
}
