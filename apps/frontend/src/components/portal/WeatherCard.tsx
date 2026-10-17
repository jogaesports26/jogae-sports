import { useEffect, useState } from 'react'
import { describeWeather, fetchForecast, playableHours, summarize } from '../../lib/weather'
import type { DayForecast } from '../../lib/weather'
import './WeatherCard.css'

interface Props {
  /** Dia escolhido na reserva, no formato AAAA-MM-DD. */
  date: string
}

export default function WeatherCard({ date }: Props) {
  const [days, setDays] = useState<DayForecast[] | null>(null)

  useEffect(() => {
    let alive = true
    fetchForecast().then((result) => alive && setDays(result))
    return () => {
      alive = false
    }
  }, [])

  const hours = days?.find((day) => day.date === date)?.hours
  const summary = hours ? summarize(hours) : null
  if (!hours || !summary) return null

  return (
    <section className="booking-section weather-card" aria-label="Previsão do tempo para o dia escolhido">
      <h2 className="booking-section__title">Previsão do tempo</h2>
      <div className="weather-card__now">
        <span className="weather-card__temp">{summary.temperature}°C</span>
        <span className="weather-card__desc">{describeWeather(summary.code)}</span>
        <ul className="weather-card__facts">
          <li>Chuva até {summary.maxRain}%</li>
          <li>Vento até {summary.maxWind} km/h</li>
          <li>UV até {summary.maxUv}</li>
        </ul>
      </div>
      <p
        className={`weather-card__note weather-card__note--${summary.attentionHours > 0 ? 'attention' : 'good'}`}
      >
        {summary.attentionHours > 0
          ? 'Alguns horários pedem atenção (chuva, vento ou sol forte).'
          : 'Condições favoráveis para jogar neste dia.'}
      </p>
      <ul className="weather-card__hours">
        {playableHours(hours).map((h) => (
          <li key={h.hour} className={`weather-card__hour weather-card__hour--${h.rating}`}>
            <span>{String(h.hour).padStart(2, '0')}h</span>
            <strong>{h.temperature}°</strong>
            <span>{h.rainChance}%</span>
          </li>
        ))}
      </ul>
      <p className="weather-card__source">Previsão por Open-Meteo. É uma estimativa e pode mudar.</p>
    </section>
  )
}
