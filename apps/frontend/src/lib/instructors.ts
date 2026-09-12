import { authFetch, parseApiError } from './api'

export interface Instructor {
  id: string
  ownerId: string
  name: string
  phone: string | null
  active: boolean
  createdAt: string
}

export interface InstructorInput {
  name: string
  phone?: string
}

export async function fetchInstructors(): Promise<Instructor[]> {
  const response = await authFetch('/instructors')
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível carregar os instrutores'))
  }
  return response.json()
}

export async function createInstructor(input: InstructorInput): Promise<Instructor> {
  const response = await authFetch('/instructors', { method: 'POST', body: JSON.stringify(input) })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível cadastrar o instrutor'))
  }
  return response.json()
}

export async function updateInstructor(id: string, input: Partial<InstructorInput> & { active?: boolean }): Promise<Instructor> {
  const response = await authFetch(`/instructors/${id}`, { method: 'PATCH', body: JSON.stringify(input) })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível salvar o instrutor'))
  }
  return response.json()
}

export async function removeInstructor(id: string): Promise<void> {
  const response = await authFetch(`/instructors/${id}`, { method: 'DELETE' })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível remover o instrutor'))
  }
}
