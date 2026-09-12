import { authFetch, parseApiError } from './api'
import type { PriceRule, RecurringMaintenanceBlock } from './courts'

export type ReservationStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'

export interface Reservation {
  id: string
  courtId: string
  guestName: string
  guestPhone: string
  startsAt: string
  endsAt: string
  status: ReservationStatus
  priceSnapshot: string
  cancelledAt: string | null
  instructorId: string | null
  instructor: { id: string; name: string } | null
  createdAt: string
  updatedAt: string
}

export interface MaintenanceBlock {
  id: string
  courtId: string
  startsAt: string
  endsAt: string
  reason: string | null
  cost: string | null
  completedAt: string | null
  createdAt: string
}

export interface AgendaResponse {
  reservations: Reservation[]
  maintenanceBlocks: MaintenanceBlock[]
  priceRules: PriceRule[]
  recurringMaintenanceBlocks: RecurringMaintenanceBlock[]
}

export interface CreateReservationInput {
  guestName: string
  guestPhone: string
  startsAt: string
  endsAt: string
  instructorId?: string
}

export interface TodayReservation extends Reservation {
  court: { id: string; name: string }
}

function toISO(date: string, minutes: number) {
  const d = new Date(`${date}T00:00:00`)
  d.setMinutes(minutes)
  return d.toISOString()
}

export { toISO }

export async function fetchAgenda(courtId: string, weekStart: string): Promise<AgendaResponse> {
  const response = await authFetch(`/courts/${courtId}/agenda?weekStart=${weekStart}`)
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível carregar a agenda'))
  }
  return response.json()
}

export async function createReservation(courtId: string, input: CreateReservationInput): Promise<Reservation> {
  const response = await authFetch(`/courts/${courtId}/reservations`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível criar a reserva'))
  }
  return response.json()
}

export async function cancelReservation(courtId: string, id: string): Promise<Reservation> {
  const response = await authFetch(`/courts/${courtId}/reservations/${id}`, { method: 'DELETE' })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível cancelar a reserva'))
  }
  return response.json()
}

export async function updateReservationStatus(
  courtId: string,
  id: string,
  status: 'COMPLETED' | 'NO_SHOW',
): Promise<Reservation> {
  const response = await authFetch(`/courts/${courtId}/reservations/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível atualizar a reserva'))
  }
  return response.json()
}

export async function createMaintenanceBlock(
  courtId: string,
  input: { startsAt: string; endsAt: string; reason?: string },
): Promise<MaintenanceBlock> {
  const response = await authFetch(`/courts/${courtId}/maintenance-blocks`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível criar o bloqueio'))
  }
  return response.json()
}

export async function deleteMaintenanceBlock(courtId: string, id: string): Promise<void> {
  const response = await authFetch(`/courts/${courtId}/maintenance-blocks/${id}`, { method: 'DELETE' })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível remover o bloqueio'))
  }
}

export async function fetchMaintenanceHistory(courtId: string): Promise<MaintenanceBlock[]> {
  const response = await authFetch(`/courts/${courtId}/maintenance-blocks`)
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível carregar o histórico de manutenção'))
  }
  return response.json()
}

export async function updateMaintenanceBlock(
  courtId: string,
  id: string,
  input: { cost?: number; completedAt?: string },
): Promise<MaintenanceBlock> {
  const response = await authFetch(`/courts/${courtId}/maintenance-blocks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível salvar o bloqueio'))
  }
  return response.json()
}

export async function fetchTodayReservations(): Promise<TodayReservation[]> {
  const response = await authFetch('/reservations/today')
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível carregar as reservas de hoje'))
  }
  return response.json()
}
