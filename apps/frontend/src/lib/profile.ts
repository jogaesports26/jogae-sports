import { authFetch, parseApiError } from './api'
import type { ResolvedTheme, StoredTheme, ThemeInput } from './theme'

export interface Profile {
  id: string
  name: string
  email: string
  role: string
  establishmentName: string | null
  establishmentPhone: string | null
  establishmentAddress: string | null
  establishmentSlug: string | null
  monthlyRevenueGoal: number | null
  aboutDescription: string | null
  coverPhotoUrl: string | null
  amenities: string[]
  theme: StoredTheme | null
}

export interface ProfileInput {
  establishmentName?: string
  establishmentPhone?: string
  establishmentAddress?: string
  establishmentSlug?: string
  theme?: ThemeInput
  monthlyRevenueGoal?: number | null
  aboutDescription?: string
  coverPhotoUrl?: string
  amenities?: string[]
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

export async function previewTheme(input: ThemeInput): Promise<ResolvedTheme> {
  const response = await authFetch('/auth/me/theme/preview', { method: 'POST', body: JSON.stringify(input) })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível calcular o tema'))
  }
  return response.json()
}

export async function restoreTheme(index: number): Promise<StoredTheme> {
  const response = await authFetch('/auth/me/theme/restore', { method: 'POST', body: JSON.stringify({ index }) })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível restaurar essa versão'))
  }
  return response.json()
}
