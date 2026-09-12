import { authFetch, parseApiError } from './api'

export interface Profile {
  id: string
  name: string
  email: string
  role: string
  establishmentName: string | null
  establishmentPhone: string | null
  establishmentAddress: string | null
}

export interface ProfileInput {
  establishmentName: string
  establishmentPhone: string
  establishmentAddress: string
}

export async function fetchProfile(): Promise<Profile> {
  const response = await authFetch('/auth/me')
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível carregar os dados do estabelecimento'))
  }
  return response.json()
}

export async function updateProfile(input: ProfileInput): Promise<Profile> {
  const response = await authFetch('/auth/me', { method: 'PATCH', body: JSON.stringify(input) })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível salvar os dados do estabelecimento'))
  }
  return response.json()
}
