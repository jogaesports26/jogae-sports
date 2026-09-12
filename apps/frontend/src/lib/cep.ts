import { API_URL, parseApiError } from './api'

export interface CepResult {
  cep: string
  logradouro: string
  bairro: string
  cidade: string
  uf: string
}

export async function fetchCep(cep: string): Promise<CepResult> {
  const digits = cep.replace(/\D/g, '')
  const response = await fetch(`${API_URL}/cep/${digits}`)
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'CEP não encontrado'))
  }
  return response.json()
}
