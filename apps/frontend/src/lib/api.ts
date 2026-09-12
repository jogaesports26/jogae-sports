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

export function clearSession() {
  localStorage.removeItem('jogae_token')
  localStorage.removeItem('jogae_user')
}

export async function parseApiError(response: Response, fallback: string): Promise<string> {
  const data = await response.json().catch(() => null)
  if (!data?.message) return fallback
  return Array.isArray(data.message) ? data.message.join(', ') : data.message
}

export class SessionExpiredError extends Error {
  constructor() {
    super('Sessão expirada')
    this.name = 'SessionExpiredError'
  }
}

/**
 * fetch com o token JWT do dono anexado. Em 401, limpa a sessão local e
 * lança SessionExpiredError — quem chamar deve navegar pro /login nesse caso.
 */
export async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('jogae_token')

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (response.status === 401) {
    clearSession()
    throw new SessionExpiredError()
  }

  return response
}
