export const API_URL = import.meta.env.VITE_API_URL ?? 'https://jogae-sports-backend.onrender.com'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
}

export interface AuthResponse {
  accessToken: string
  user: AuthUser
}

export function saveSession(auth: AuthResponse) {
  localStorage.setItem('jogae_token', auth.accessToken)
  localStorage.setItem('jogae_user', JSON.stringify(auth.user))
}

export async function parseApiError(response: Response, fallback: string): Promise<string> {
  const data = await response.json().catch(() => null)
  if (!data?.message) return fallback
  return Array.isArray(data.message) ? data.message.join(', ') : data.message
}
