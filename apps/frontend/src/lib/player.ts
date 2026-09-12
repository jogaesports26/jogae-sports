import { API_URL, parseApiError } from './api'
import type { PriceRule } from './courts'
import type { AgendaResponse } from './reservations'

export interface PlayerUser {
  id: string
  phone: string
  name: string | null
}

export interface PublicCourt {
  id: string
  name: string
  sport: string
  surfaceType: string
  hasLighting: boolean
  photoUrls: string[]
  owner: { establishmentName: string | null; establishmentAddress: string | null; establishmentPhone?: string | null }
  fromPricePerHour: string | null
}

export interface PlayerReservation {
  id: string
  courtId: string
  startsAt: string
  endsAt: string
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
  priceSnapshot: string
  court: { id: string; name: string; owner: { establishmentName: string | null } }
}

export class PlayerSessionExpiredError extends Error {
  constructor() {
    super('Sessão do jogador expirada')
    this.name = 'PlayerSessionExpiredError'
  }
}

export function savePlayerSession(accessToken: string, player: PlayerUser) {
  localStorage.setItem('jogae_player_token', accessToken)
  localStorage.setItem('jogae_player_user', JSON.stringify(player))
}

export function clearPlayerSession() {
  localStorage.removeItem('jogae_player_token')
  localStorage.removeItem('jogae_player_user')
}

export function getPlayerUser(): PlayerUser | null {
  const raw = localStorage.getItem('jogae_player_user')
  return raw ? JSON.parse(raw) : null
}

async function playerFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('jogae_player_token')

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (response.status === 401) {
    clearPlayerSession()
    throw new PlayerSessionExpiredError()
  }

  return response
}

export async function fetchPublicCourts(): Promise<PublicCourt[]> {
  const response = await fetch(`${API_URL}/public/courts`)
  if (!response.ok) throw new Error(await parseApiError(response, 'Não foi possível carregar as quadras'))
  return response.json()
}

export async function fetchPublicCourt(id: string): Promise<PublicCourt> {
  const response = await fetch(`${API_URL}/public/courts/${id}`)
  if (!response.ok) throw new Error(await parseApiError(response, 'Não foi possível carregar a quadra'))
  return response.json()
}

export async function fetchPublicAgenda(courtId: string, weekStart: string): Promise<AgendaResponse> {
  const response = await fetch(`${API_URL}/public/courts/${courtId}/agenda?weekStart=${weekStart}`)
  if (!response.ok) throw new Error(await parseApiError(response, 'Não foi possível carregar os horários'))
  return response.json()
}

export async function requestOtp(phone: string): Promise<{ devCode: string }> {
  const response = await fetch(`${API_URL}/player-auth/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  })
  if (!response.ok) throw new Error(await parseApiError(response, 'Não foi possível enviar o código'))
  return response.json()
}

export async function verifyOtp(phone: string, code: string): Promise<{ accessToken: string; player: PlayerUser }> {
  const response = await fetch(`${API_URL}/player-auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  })
  if (!response.ok) throw new Error(await parseApiError(response, 'Código inválido ou expirado'))
  return response.json()
}

export async function createPlayerReservation(
  courtId: string,
  input: { startsAt: string; endsAt: string },
): Promise<PlayerReservation> {
  const response = await playerFetch(`/public/courts/${courtId}/reservations`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (!response.ok) throw new Error(await parseApiError(response, 'Não foi possível criar a reserva'))
  return response.json()
}

export async function fetchPlayerReservations(): Promise<PlayerReservation[]> {
  const response = await playerFetch('/me/reservations')
  if (!response.ok) throw new Error(await parseApiError(response, 'Não foi possível carregar suas reservas'))
  return response.json()
}

export async function cancelPlayerReservation(id: string): Promise<void> {
  const response = await playerFetch(`/me/reservations/${id}`, { method: 'DELETE' })
  if (!response.ok) throw new Error(await parseApiError(response, 'Não foi possível cancelar a reserva'))
}

export type { PriceRule }
