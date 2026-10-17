import { API_URL } from './api'

// Recurso TEMPORÁRIO (trabalho de Clima). Some sozinho se a API responder enabled=false.
export interface HourForecast {
  hour: number
  temperature: number
  rainChance: number
  wind: number
  uv: number
  code: number
  rating: 'good' | 'attention'
}

export interface DayForecast {
  date: string
  hours: HourForecast[]
}

export async function fetchForecast(): Promise<DayForecast[]> {
  try {
    const response = await fetch(`${API_URL}/weather/forecast`)
    if (!response.ok) return []
    const data = (await response.json()) as { enabled: boolean; days: DayForecast[] }
    return data.enabled ? data.days : []
  } catch {
    return []
  }
}

/** Descrição curta do código WMO usado pela Open-Meteo. */
export function describeWeather(code: number): string {
  if (code === 0) return 'Céu limpo'
  if (code <= 3) return 'Parcialmente nublado'
  if (code <= 48) return 'Nublado ou neblina'
  if (code <= 57) return 'Garoa'
  if (code <= 67) return 'Chuva'
  if (code <= 82) return 'Pancadas de chuva'
  return 'Tempestade'
}

/** Horas do dia que a quadra costuma abrir, para o resumo não incluir a madrugada. */
export function playableHours(hours: HourForecast[]): HourForecast[] {
  return hours.filter((h) => h.hour >= 6 && h.hour <= 22)
}

export function summarize(hours: HourForecast[]) {
  const list = playableHours(hours)
  if (list.length === 0) return null
  const noon = list.reduce((best, h) => (Math.abs(h.hour - 15) < Math.abs(best.hour - 15) ? h : best))
  return {
    temperature: noon.temperature,
    code: noon.code,
    maxRain: Math.max(...list.map((h) => h.rainChance)),
    maxWind: Math.max(...list.map((h) => h.wind)),
    maxUv: Math.max(...list.map((h) => h.uv)),
    attentionHours: list.filter((h) => h.rating === 'attention').length,
  }
}
