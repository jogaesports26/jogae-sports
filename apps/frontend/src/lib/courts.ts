import { authFetch, parseApiError } from './api'

export interface PriceRule {
  id: string
  courtId: string
  dayOfWeek: number
  startMinute: number
  endMinute: number
  pricePerHour: string
}

export interface RecurringMaintenanceBlock {
  id: string
  courtId: string
  dayOfWeek: number
  startMinute: number
  endMinute: number
  reason: string | null
}

export interface Court {
  id: string
  ownerId: string
  name: string
  sport: string
  surfaceType: string
  hasLighting: boolean
  photoUrls: string[]
  active: boolean
  createdAt: string
  updatedAt: string
  priceRules: PriceRule[]
  recurringMaintenanceBlocks: RecurringMaintenanceBlock[]
}

export interface CourtInput {
  name: string
  sport: string
  surfaceType: string
  hasLighting: boolean
  photoUrls: string[]
}

export interface PriceRuleInput {
  dayOfWeek: number
  startMinute: number
  endMinute: number
  pricePerHour: number
}

export interface RecurringMaintenanceBlockInput {
  dayOfWeek: number
  startMinute: number
  endMinute: number
  reason?: string
}

export const SPORT_OPTIONS = [
  { value: 'FUTEBOL', label: 'Futebol' },
  { value: 'FUTSAL', label: 'Futsal' },
  { value: 'SOCIETY', label: 'Society' },
  { value: 'VOLEI', label: 'Vôlei' },
  { value: 'BEACH_TENNIS', label: 'Beach tennis' },
  { value: 'TENIS', label: 'Tênis' },
  { value: 'BASQUETE', label: 'Basquete' },
  { value: 'OUTRO', label: 'Outro' },
]

export const SURFACE_OPTIONS = [
  { value: 'GRAMA_SINTETICA', label: 'Grama sintética' },
  { value: 'GRAMA_NATURAL', label: 'Grama natural' },
  { value: 'QUADRA_POLIESPORTIVA', label: 'Quadra poliesportiva' },
  { value: 'SAIBRO', label: 'Saibro' },
  { value: 'TACO', label: 'Taco' },
  { value: 'AREIA', label: 'Areia' },
  { value: 'OUTRO', label: 'Outro' },
]

export const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export async function fetchCourts(): Promise<Court[]> {
  const response = await authFetch('/courts')
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível carregar as quadras'))
  }
  return response.json()
}

export async function fetchCourt(id: string): Promise<Court> {
  const response = await authFetch(`/courts/${id}`)
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível carregar a quadra'))
  }
  return response.json()
}

export async function createCourt(input: CourtInput): Promise<Court> {
  const response = await authFetch('/courts', { method: 'POST', body: JSON.stringify(input) })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível criar a quadra'))
  }
  return response.json()
}

export async function updateCourt(id: string, input: Partial<CourtInput>): Promise<Court> {
  const response = await authFetch(`/courts/${id}`, { method: 'PATCH', body: JSON.stringify(input) })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível salvar a quadra'))
  }
  return response.json()
}

export async function deleteCourt(id: string): Promise<void> {
  const response = await authFetch(`/courts/${id}`, { method: 'DELETE' })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível remover a quadra'))
  }
}

export async function replacePriceRules(courtId: string, rules: PriceRuleInput[]): Promise<PriceRule[]> {
  const response = await authFetch(`/courts/${courtId}/price-rules`, {
    method: 'PUT',
    body: JSON.stringify({ rules }),
  })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível salvar os preços'))
  }
  return response.json()
}

export async function replaceRecurringMaintenanceBlocks(
  courtId: string,
  blocks: RecurringMaintenanceBlockInput[],
): Promise<RecurringMaintenanceBlock[]> {
  const response = await authFetch(`/courts/${courtId}/recurring-maintenance-blocks`, {
    method: 'PUT',
    body: JSON.stringify({ blocks }),
  })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível salvar os bloqueios recorrentes'))
  }
  return response.json()
}
