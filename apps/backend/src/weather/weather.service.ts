import { Injectable, ServiceUnavailableException } from '@nestjs/common';

// Recurso TEMPORÁRIO (trabalho interdisciplinar de Clima). Para remover: WEATHER_ENABLED=false
// e, depois, apagar a pasta weather/ e o WeatherCard do front (ver docs/gestao/09-clima-temporario.md).

export interface HourForecast {
  hour: number;
  temperature: number;
  rainChance: number;
  wind: number;
  uv: number;
  code: number;
  rating: 'good' | 'attention';
}

export interface DayForecast {
  date: string;
  hours: HourForecast[];
}

interface OpenMeteoResponse {
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    wind_speed_10m: number[];
    uv_index: number[];
    weather_code: number[];
  };
}

const CACHE_MS = 30 * 60 * 1000;

export function rateHour(
  rainChance: number,
  wind: number,
  uv: number,
): 'good' | 'attention' {
  return rainChance > 40 || wind > 30 || uv >= 8 ? 'attention' : 'good';
}

export function parseForecast(data: OpenMeteoResponse): DayForecast[] {
  const days = new Map<string, HourForecast[]>();
  const h = data.hourly;
  h.time.forEach((time, i) => {
    const [date, clock] = time.split('T');
    const rainChance = Math.round(h.precipitation_probability[i] ?? 0);
    const wind = Math.round(h.wind_speed_10m[i] ?? 0);
    const uv = Math.round(h.uv_index[i] ?? 0);
    const list = days.get(date) ?? [];
    list.push({
      hour: Number.parseInt(clock.slice(0, 2), 10),
      temperature: Math.round(h.temperature_2m[i] ?? 0),
      rainChance,
      wind,
      uv,
      code: h.weather_code[i] ?? 0,
      rating: rateHour(rainChance, wind, uv),
    });
    days.set(date, list);
  });
  return [...days].map(([date, hours]) => ({ date, hours }));
}

@Injectable()
export class WeatherService {
  private cache: { at: number; days: DayForecast[] } | null = null;

  get enabled(): boolean {
    return process.env.WEATHER_ENABLED === 'true';
  }

  async forecast() {
    if (!this.enabled) return { enabled: false as const, days: [] };
    if (this.cache && Date.now() - this.cache.at < CACHE_MS) {
      return { enabled: true as const, days: this.cache.days };
    }
    // Padrão: Fortaleza. O sistema ainda não guarda coordenadas por estabelecimento.
    const lat = process.env.WEATHER_LAT ?? '-3.7319';
    const lon = process.env.WEATHER_LON ?? '-38.5267';
    const url =
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}` +
      '&hourly=temperature_2m,precipitation_probability,wind_speed_10m,uv_index,weather_code' +
      '&forecast_days=7&timezone=America%2FFortaleza';
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error(String(response.status));
      const days = parseForecast((await response.json()) as OpenMeteoResponse);
      this.cache = { at: Date.now(), days };
      return { enabled: true as const, days };
    } catch {
      if (this.cache) return { enabled: true as const, days: this.cache.days };
      throw new ServiceUnavailableException(
        'Previsão do tempo indisponível agora',
      );
    }
  }
}
