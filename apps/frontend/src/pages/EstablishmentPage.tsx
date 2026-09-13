import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchEstablishment } from '../lib/player'
import type { Establishment } from '../lib/player'
import { SPORT_OPTIONS, SURFACE_OPTIONS } from '../lib/courts'
import { amenityLabel } from '../lib/amenities'
import { SoccerBall, Basketball, Volleyball, TennisBall, Trophy } from './SportIcons'
import './EstablishmentPage.css'

const sportLabel = (value: string) => SPORT_OPTIONS.find((option) => option.value === value)?.label ?? value
const surfaceLabel = (value: string) =>
  SURFACE_OPTIONS.find((option) => option.value === value)?.label ?? value

const SPORT_ICONS: Record<string, typeof SoccerBall> = {
  FUTEBOL: SoccerBall,
  FUTSAL: SoccerBall,
  SOCIETY: SoccerBall,
  VOLEI: Volleyball,
  BEACH_TENNIS: TennisBall,
  TENIS: TennisBall,
  BASQUETE: Basketball,
}

function sportIcon(value: string) {
  const Icon = SPORT_ICONS[value] ?? Trophy
  return <Icon />
}

export default function EstablishmentPage() {
  const { slug } = useParams<{ slug: string }>()
  const [establishment, setEstablishment] = useState<Establishment | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return
    fetchEstablishment(slug)
      .then(setEstablishment)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar o estabelecimento'))
  }, [slug])

  if (error) return <p className="establishment-page__error">{error}</p>
  if (!establishment) return <p className="establishment-page__loading">Carregando...</p>

  return (
    <div className="establishment-page">
      {establishment.coverPhotoUrl && (
        <img src={establishment.coverPhotoUrl} alt="" className="establishment-page__cover" />
      )}

      <div className="establishment-page__header">
        <h1>{establishment.establishmentName ?? 'Reserve sua quadra'}</h1>
        {establishment.establishmentAddress && (
          <p className="establishment-page__address">{establishment.establishmentAddress}</p>
        )}
        <p className="establishment-page__subtitle">
          Escolha a quadra, veja os horários disponíveis e confirme sua reserva na hora.
        </p>
        {establishment.amenities.length > 0 && (
          <div className="establishment-page__amenities">
            {establishment.amenities.map((amenity) => (
              <span key={amenity} className="pill pill--neutral">
                {amenityLabel(amenity)}
              </span>
            ))}
          </div>
        )}
      </div>

      {establishment.courts.length === 0 ? (
        <p className="establishment-page__empty">Nenhuma quadra disponível pra reserva no momento.</p>
      ) : (
        <div className="establishment-page__grid">
          {establishment.courts.map((court) => (
            <Link key={court.id} to={`/${slug}/${court.id}`} className="establishment-card">
              <div className="establishment-card__media">
                {court.photoUrls[0] ? (
                  <img src={court.photoUrls[0]} alt="" />
                ) : (
                  <span className="establishment-card__icon" aria-hidden="true">
                    {sportIcon(court.sport)}
                  </span>
                )}
                {court.reviewCount > 0 && (
                  <span className="establishment-card__rating">
                    ★ {court.averageRating?.toFixed(1)} ({court.reviewCount})
                  </span>
                )}
              </div>
              <div className="establishment-card__body">
                <h3>{court.name}</h3>
                <p className="establishment-card__meta">
                  {sportLabel(court.sport)} · {surfaceLabel(court.surfaceType)}
                  {court.hasLighting ? ' · Com iluminação' : ''}
                </p>
                {court.fromPricePerHour && (
                  <p className="establishment-card__price">
                    A partir de R$ {Number(court.fromPricePerHour).toFixed(2).replace('.', ',')}/h
                  </p>
                )}
              </div>
              <span className="establishment-card__cta">Ver horários →</span>
            </Link>
          ))}
        </div>
      )}

      {establishment.aboutDescription && (
        <div className="establishment-page__about">
          <h2>Sobre</h2>
          <p>{establishment.aboutDescription}</p>
        </div>
      )}
    </div>
  )
}
