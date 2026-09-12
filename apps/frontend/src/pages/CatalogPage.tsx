import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPublicCourts } from '../lib/player'
import type { PublicCourt } from '../lib/player'
import { SPORT_OPTIONS, SURFACE_OPTIONS } from '../lib/courts'
import './CatalogPage.css'

const sportLabel = (value: string) => SPORT_OPTIONS.find((option) => option.value === value)?.label ?? value
const surfaceLabel = (value: string) =>
  SURFACE_OPTIONS.find((option) => option.value === value)?.label ?? value

export default function CatalogPage() {
  const [courts, setCourts] = useState<PublicCourt[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPublicCourts()
      .then(setCourts)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar quadras'))
  }, [])

  return (
    <div className="catalog-page">
      <h1>Encontre uma quadra e reserve na hora</h1>
      <p className="catalog-page__subtitle">
        Escolha o esporte, veja os horários disponíveis e confirme sua reserva sem precisar ligar pra ninguém.
      </p>

      {error && <p className="catalog-page__error">{error}</p>}

      {!error && courts === null && <p className="catalog-page__loading">Carregando quadras...</p>}

      {courts !== null && courts.length === 0 && (
        <p className="catalog-page__empty">Nenhuma quadra disponível pra reserva no momento.</p>
      )}

      {courts !== null && courts.length > 0 && (
        <div className="catalog-page__grid">
          {courts.map((court) => (
            <Link key={court.id} to={`/reservar/${court.id}`} className="catalog-card">
              <h3>{court.name}</h3>
              <p className="catalog-card__meta">
                {sportLabel(court.sport)} · {surfaceLabel(court.surfaceType)}
                {court.hasLighting ? ' · Com iluminação' : ''}
              </p>
              {court.owner.establishmentName && (
                <p className="catalog-card__establishment">{court.owner.establishmentName}</p>
              )}
              {court.reviewCount > 0 && (
                <p className="catalog-card__rating">
                  ★ {court.averageRating?.toFixed(1)} ({court.reviewCount})
                </p>
              )}
              {court.fromPricePerHour && (
                <p className="catalog-card__price">
                  A partir de R$ {Number(court.fromPricePerHour).toFixed(2).replace('.', ',')}/h
                </p>
              )}
              <span className="catalog-card__cta">Ver horários →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
