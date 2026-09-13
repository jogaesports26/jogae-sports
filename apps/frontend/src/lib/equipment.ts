import { API_URL, authFetch, parseApiError } from './api'

export interface Equipment {
  id: string
  ownerId: string
  name: string
  pricePerUnit: number
  active: boolean
  createdAt: string
}

export interface EquipmentInput {
  name: string
  pricePerUnit: number
}

function normalizeEquipment(equipment: Equipment): Equipment {
  return { ...equipment, pricePerUnit: Number(equipment.pricePerUnit) }
}

export async function fetchEquipment(): Promise<Equipment[]> {
  const response = await authFetch('/equipment')
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível carregar os equipamentos'))
  }
  const equipment: Equipment[] = await response.json()
  return equipment.map(normalizeEquipment)
}

export async function createEquipment(input: EquipmentInput): Promise<Equipment> {
  const response = await authFetch('/equipment', { method: 'POST', body: JSON.stringify(input) })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível cadastrar o equipamento'))
  }
  return normalizeEquipment(await response.json())
}

export async function updateEquipment(id: string, input: Partial<EquipmentInput> & { active?: boolean }): Promise<Equipment> {
  const response = await authFetch(`/equipment/${id}`, { method: 'PATCH', body: JSON.stringify(input) })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível salvar o equipamento'))
  }
  return normalizeEquipment(await response.json())
}

export async function removeEquipment(id: string): Promise<void> {
  const response = await authFetch(`/equipment/${id}`, { method: 'DELETE' })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível remover o equipamento'))
  }
}

export async function fetchActiveEquipmentForCourt(courtId: string): Promise<Equipment[]> {
  const response = await fetch(`${API_URL}/public/courts/${courtId}/equipment`)
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível carregar os equipamentos'))
  }
  const equipment: Equipment[] = await response.json()
  return equipment.map(normalizeEquipment)
}
