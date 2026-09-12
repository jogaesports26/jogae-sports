import { authFetch, parseApiError, API_URL } from './api'

export interface WaitlistEntry {
  id: string
  courtId: string
  name: string
  phone: string
  startsAt: string
  endsAt: string
  notifiedAt: string | null
  createdAt: string
}

export interface JoinWaitlistInput {
  name: string
  phone: string
  startsAt: string
  endsAt: string
}

export async function joinWaitlist(courtId: string, input: JoinWaitlistInput): Promise<WaitlistEntry> {
  const response = await fetch(`${API_URL}/public/courts/${courtId}/waitlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível entrar na fila de espera'))
  }
  return response.json()
}

export async function fetchWaitlist(courtId: string): Promise<WaitlistEntry[]> {
  const response = await authFetch(`/courts/${courtId}/waitlist`)
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível carregar a fila de espera'))
  }
  return response.json()
}

export async function removeWaitlistEntry(courtId: string, id: string): Promise<void> {
  const response = await authFetch(`/courts/${courtId}/waitlist/${id}`, { method: 'DELETE' })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível remover da fila de espera'))
  }
}
