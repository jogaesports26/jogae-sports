import { authFetch, parseApiError } from './api'

export interface Customer {
  phone: string
  name: string
  playerId: string | null
  birthDate: string | null
  totalReservations: number
  totalSpent: number
  noShowCount: number
  lastReservationAt: string
  daysSinceLastReservation: number
}

export interface CustomerReservation {
  id: string
  startsAt: string
  endsAt: string
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
  priceSnapshot: string
  court: { id: string; name: string }
}

export async function fetchCustomers(): Promise<Customer[]> {
  const response = await authFetch('/customers')
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível carregar os clientes'))
  }
  return response.json()
}

export async function fetchCustomerHistory(phone: string): Promise<CustomerReservation[]> {
  const response = await authFetch(`/customers/${encodeURIComponent(phone)}`)
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível carregar o histórico do cliente'))
  }
  return response.json()
}

export async function updateCustomerBirthDate(playerId: string, birthDate: string): Promise<Customer> {
  const response = await authFetch(`/customers/${playerId}/birth-date`, {
    method: 'PATCH',
    body: JSON.stringify({ birthDate }),
  })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível salvar a data de nascimento'))
  }
  return response.json()
}
