import { API_URL } from './api'

export interface PublicStats {
  establishments: number
  courts: number
  reservations: number
}

export async function fetchPublicStats(): Promise<PublicStats | null> {
  try {
    const response = await fetch(`${API_URL}/public/stats`)
    return response.ok ? await response.json() : null
  } catch {
    return null
  }
}
