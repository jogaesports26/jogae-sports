import { useEffect, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import { fetchEstablishment } from '../lib/player'
import type { Establishment } from '../lib/player'
import { SPORT_OPTIONS, SURFACE_OPTIONS } from '../lib/courts'
import { amenityLabel } from '../lib/amenities'
import { formatPhone, phoneDigits } from '../lib/phone'
import { SoccerBall, Basketball, Volleyball, TennisBall, Trophy } from './SportIcons'
import HeartToggle from '../components/HeartToggle'
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

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function formatPrice(value: number) {
  return Number.isInteger(value) ? `R$ ${value}` : `R$ ${value.toFixed(2).replace('.', ',')}`
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function SlidersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="15" cy="7" r="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="17" r="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9 2.6-5.3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.6-3 8.3-7 10-4-1.7-7-5.4-7-10V6l7-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5L16 13l4 1.5v3a2 2 0 0 1-2 2A14 14 0 0 1 4.5 6a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function EstablishmentSkeleton() {
  return (
    <div className="establishment-page" aria-busy="true" aria-label="Carregando a lojinha">
      <div className="establishment-skeleton establishment-skeleton--hero" />
      <div className="establishment-skeleton establishment-skeleton--chips" />
      <div className="establishment-page__grid">
        <div className="establishment-skeleton establishment-skeleton--card" />
        <div className="establishment-skeleton establishment-skeleton--card" />
      </div>
    </div>
  )
}

export default function EstablishmentPage() {
  const { slug } = useParams<{ slug: string }>()
  const { basePath } = useOutletContext<{ basePath: string }>()
  const [establishment, setEstablishment] = useState<Establishment | null>(null)
  const [error, setError] = useState('')
  const [sportFilter, setSportFilter] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [onlyLighting, setOnlyLighting] = useState(false)
  const [sortByPrice, setSortByPrice] = useState(false)

  useEffect(() => {
    if (!slug) return
    fetchEstablishment(slug)
      .then(setEstablishment)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar o estabelecimento'))
  }, [slug])

  if (error) return <p className="establishment-page__error">{error}</p>
  if (!establishment) return <EstablishmentSkeleton />

  const availableSports = [...new Set(establishment.courts.map((court) => court.sport))]
  const query = normalize(search.trim())
  const activeFilterCount = Number(onlyLighting) + Number(sortByPrice)

  let visibleCourts = establishment.courts.filter((court) => {
    if (sportFilter && court.sport !== sportFilter) return false
    if (onlyLighting && !court.hasLighting) return false
    if (query) {
      const haystack = normalize(`${court.name} ${sportLabel(court.sport)} ${surfaceLabel(court.surfaceType)}`)
      if (!haystack.includes(query)) return false
    }
    return true
  })
  if (sortByPrice) {
    visibleCourts = [...visibleCourts].sort(
      (a, b) => Number(a.fromPricePerHour ?? Infinity) - Number(b.fromPricePerHour ?? Infinity),
    )
  }

  const totalReviews = establishment.courts.reduce((sum, court) => sum + court.reviewCount, 0)
  const averageRating =
    totalReviews > 0
      ? establishment.courts.reduce((sum, court) => sum + (court.averageRating ?? 0) * court.reviewCount, 0) /
        totalReviews
      : null
  const phoneNumber = establishment.establishmentPhone ? phoneDigits(establishment.establishmentPhone) : ''
  const mapsUrl = establishment.establishmentAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(establishment.establishmentAddress)}`
    : null

  function clearFilters() {
    setSportFilter(null)
    setSearch('')
    setOnlyLighting(false)
    setSortByPrice(false)
  }

  return (
    <div className="establishment-page">
      <header className="establishment-hero">
        <div className="establishment-hero__top">
          <div className="establishment-hero__title">
            <h1>{establishment.establishmentName ?? 'Reserve sua quadra'}</h1>
            {establishment.establishmentAddress && (
              <p className="establishment-hero__address">
                <PinIcon />
                {establishment.establishmentAddress}
              </p>
            )}
          </div>
        </div>

        <div className="establishment-search">
          <SearchIcon />
          <input
            type="search"
            className="establishment-search__input"
            placeholder="Buscar quadra ou esporte"
            aria-label="Buscar quadra ou esporte"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <span className="establishment-search__divider" aria-hidden="true" />
          <button
            type="button"
            className="establishment-search__filters"
            aria-label="Filtros"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <SlidersIcon />
            {activeFilterCount > 0 && <span className="establishment-search__badge">{activeFilterCount}</span>}
          </button>
        </div>

        {filtersOpen && (
          <div className="establishment-filters">
            <button
              type="button"
              className={`establishment-filters__chip${onlyLighting ? ' establishment-filters__chip--active' : ''}`}
              aria-pressed={onlyLighting}
              onClick={() => setOnlyLighting((value) => !value)}
            >
              Com iluminação
            </button>
            <button
              type="button"
              className={`establishment-filters__chip${sortByPrice ? ' establishment-filters__chip--active' : ''}`}
              aria-pressed={sortByPrice}
              onClick={() => setSortByPrice((value) => !value)}
            >
              Menor preço primeiro
            </button>
          </div>
        )}
      </header>

      {establishment.coverPhotoUrl && (
        <img src={establishment.coverPhotoUrl} alt="" className="establishment-page__cover" />
      )}

      {establishment.amenities.length > 0 && (
        <div className="establishment-page__amenities">
          {establishment.amenities.map((amenity) => (
            <span key={amenity} className="pill pill--neutral">
              {amenityLabel(amenity)}
            </span>
          ))}
        </div>
      )}

      {availableSports.length > 1 && (
        <div className="establishment-sports" role="group" aria-label="Filtrar por esporte">
          <button
            type="button"
            className={`establishment-sport${sportFilter === null ? ' establishment-sport--active' : ''}`}
            aria-pressed={sportFilter === null}
            onClick={() => setSportFilter(null)}
          >
            <span className="establishment-sport__icon">
              <Trophy />
            </span>
            <span className="establishment-sport__label">Todas</span>
          </button>
          {availableSports.map((sport) => (
            <button
              key={sport}
              type="button"
              className={`establishment-sport${sportFilter === sport ? ' establishment-sport--active' : ''}`}
              aria-pressed={sportFilter === sport}
              onClick={() => setSportFilter(sport)}
            >
              <span className="establishment-sport__icon">{sportIcon(sport)}</span>
              <span className="establishment-sport__label">{sportLabel(sport)}</span>
            </button>
          ))}
        </div>
      )}

      {establishment.courts.length === 0 ? (
        <p className="establishment-page__empty">Nenhuma quadra disponível pra reserva no momento.</p>
      ) : visibleCourts.length === 0 ? (
        <div className="establishment-page__empty-card">
          <p>Nenhuma quadra encontrada com esses filtros.</p>
          <button type="button" className="btn btn--outline btn--sm" onClick={clearFilters}>
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="establishment-page__grid">
          {visibleCourts.map((court) => (
            <Link key={court.id} to={`${basePath}/${court.id}`} className="establishment-card">
              <div className="establishment-card__media">
                {court.photoUrls[0] ? (
                  <img src={court.photoUrls[0]} alt="" />
                ) : (
                  <span className="establishment-card__icon" aria-hidden="true">
                    {sportIcon(court.sport)}
                  </span>
                )}
                <HeartToggle courtId={court.id} className="establishment-card__favorite" />
                {court.fromPricePerHour && (
                  <span className="establishment-card__price">
                    {formatPrice(Number(court.fromPricePerHour))}/h
                  </span>
                )}
              </div>
              <div className="establishment-card__body">
                <div className="establishment-card__row">
                  <h3>{court.name}</h3>
                  {court.reviewCount > 0 && (
                    <span className="establishment-card__rating">
                      ★ {court.averageRating?.toFixed(1)} <small>({court.reviewCount})</small>
                    </span>
                  )}
                </div>
                <div className="establishment-card__tags">
                  <span className="pill pill--info">{sportLabel(court.sport)}</span>
                  <span className="pill pill--positive">{surfaceLabel(court.surfaceType)}</span>
                  {court.hasLighting && <span className="pill pill--warning">Iluminação</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <section className="establishment-trust" aria-label="Informações do estabelecimento">
        <h2>Sobre o local</h2>
        <ul>
          {averageRating !== null && (
            <li>
              <StarIcon />
              <span>
                <strong>{averageRating.toFixed(1)}</strong> de nota média ·{' '}
                {totalReviews} {totalReviews === 1 ? 'avaliação' : 'avaliações'}
              </span>
            </li>
          )}
          {establishment.establishmentAddress && (
            <li>
              <PinIcon />
              <span>
                {establishment.establishmentAddress}
                {mapsUrl && (
                  <>
                    {' · '}
                    <a href={mapsUrl} target="_blank" rel="noreferrer">
                      Como chegar
                    </a>
                  </>
                )}
              </span>
            </li>
          )}
          {phoneNumber && (
            <li>
              <PhoneIcon />
              <span>
                <a href={`tel:${phoneNumber}`}>{formatPhone(phoneNumber)}</a>
              </span>
            </li>
          )}
          <li>
            <ShieldIcon />
            <span>Cancelamento ou reagendamento até 2h antes do horário.</span>
          </li>
        </ul>
        {establishment.aboutDescription && <p className="establishment-trust__about">{establishment.aboutDescription}</p>}
      </section>
    </div>
  )
}
