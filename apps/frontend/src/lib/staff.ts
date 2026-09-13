import { authFetch, parseApiError } from './api'

export type StaffPermission = 'MANAGE_RESERVATIONS' | 'VIEW_ONLY'

export interface StaffMember {
  id: string
  ownerId: string
  name: string
  email: string
  permission: StaffPermission
  active: boolean
  createdAt: string
}

export interface CreateStaffInput {
  name: string
  email: string
  password: string
  permission?: StaffPermission
}

export interface UpdateStaffInput {
  name?: string
  permission?: StaffPermission
  active?: boolean
  password?: string
}

export async function fetchStaff(): Promise<StaffMember[]> {
  const response = await authFetch('/staff')
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível carregar os funcionários'))
  }
  return response.json()
}

export async function createStaff(input: CreateStaffInput): Promise<StaffMember> {
  const response = await authFetch('/staff', { method: 'POST', body: JSON.stringify(input) })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível cadastrar o funcionário'))
  }
  return response.json()
}

export async function updateStaff(id: string, input: UpdateStaffInput): Promise<StaffMember> {
  const response = await authFetch(`/staff/${id}`, { method: 'PATCH', body: JSON.stringify(input) })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível salvar o funcionário'))
  }
  return response.json()
}

export async function removeStaff(id: string): Promise<void> {
  const response = await authFetch(`/staff/${id}`, { method: 'DELETE' })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível remover o funcionário'))
  }
}
