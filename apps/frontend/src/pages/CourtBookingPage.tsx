import { useEffect, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import { fetchCourtReviews, fetchPublicAgenda, fetchPublicCourt } from '../lib/player'
import type { AgendaResponse } from '../lib/reservations'
import type { CourtReview, PublicCourt } from '../lib/player'
import { SPORT_OPTIONS, SURFACE_OPTIONS } from '../lib/courts'
import {
  addDays,
  findOccupant,
  formatDuration,
  formatMinutes,
  getAvailableStartTimes,
  getDayStepGrid,
  sumPriceForRange,
  toDateInputValue,
  WEEKDAY_SHORT,
} from '../lib/weekGrid'
import { SoccerBall, Basketball, Volleyball, TennisBall, Trophy } from './SportIcons'
import BookingFlowModal from '../components/portal/BookingFlowModal'
import WaitlistJoinModal from '../components/portal/WaitlistJoinModal'
import HeartToggle from '../components/HeartToggle'
import './CourtBookingPage.css'

const sportLabel = (value: string) => SPORT_OPTIONS.find((option) => option.value === value)?.label ?? value
const surfaceLabel = (value: string) =>
  SURFACE_OPTIONS.find((option) => option.value === value)?.label ?? value

const DURATION_CHOICES = [30, 45, 60, 90, 120, 150, 180, 240]

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

interface PendingSlot {
  dayDate: Date
  dayLabel: string
  startMinute: number
  endMinute: number
  price: number
}

interface WaitlistSlot {
  dayDate: Date
  dayLabel: string
  startMinute: number
  endMinute: number
}

export default function CourtBookingPage() {
  const { courtId, slug } = useParams<{ courtId: string; slug: string }>()
  const { basePath } = useOutletContext<{ basePath: string }>()
  const [court, setCourt] = useState<PublicCourt | null>(null)
  const [agenda, setAgenda] = useState<AgendaResponse | null>(null)
  const [reviews, setReviews] = useState<CourtReview[]>([])
  const [error, setError] = useState('')
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null)
  const [pendingSlot, setPendingSlot] = useState<PendingSlot | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<PendingSlot | null>(null)
  const [waitlistSlot, setWaitlistSlot] = useState<WaitlistSlot | null>(null)

  async function load() {
    if (!courtId) return
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const [courtData, agendaData, reviewsData] = await Promise.all([
        fetchPublicCourt(courtId),
        fetchPublicAgenda(courtId, toDateInputValue(today)),
        fetchCourtReviews(courtId).catch(() => []),
      ])
      setCourt(courtData)
      setAgenda(agendaData)
      setReviews(reviewsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar a quadra')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courtId])

  if (error) return <p className="booking-page__error">{error}</p>
  if (!court || !agenda) return <p className="booking-page__loading">Carregando...</p>

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i))
  const selectedDay = days[selectedDayIndex]
  const selectedDayOfWeek = selectedDay.getDay()
  const selectedDayLabel = `${WEEKDAY_SHORT[selectedDayOfWeek]} ${selectedDay.getDate()}`

  const dayGrid = getDayStepGrid(selectedDayOfWeek, court.bookingStepMinutes, agenda.priceRules)

  const durationOptions = [...new Set([court.minBookingMinutes, ...DURATION_CHOICES])]
    .filter((d) => d >= court.minBookingMinutes && (court.maxBookingMinutes == null || d <= court.maxBookingMinutes))
    .sort((a, b) => a - b)
  const duration =
    selectedDuration !== null && durationOptions.includes(selectedDuration) ? selectedDuration : court.minBookingMinutes

  const availableStarts = new Set(
    getAvailableStartTimes(
      selectedDayOfWeek,
      duration,
      court.bookingStepMinutes,
      agenda.priceRules,
      selectedDay,
      agenda.reservations,
      agenda.maintenanceBlocks,
      agenda.recurringMaintenanceBlocks,
    ),
  )

  const heroPhoto = court.photoUrls[0]
  const establishmentName = court.owner.establishmentName

  function selectDay(index: number) {
    setSelectedDayIndex(index)
    setPendingSlot(null)
  }

  function selectDuration(minutes: number) {
    setSelectedDuration(minutes)
    setPendingSlot(null)
  }

  function confirmPendingSlot() {
    if (pendingSlot) setSelectedSlot(pendingSlot)
  }

  return (
    <div className="booking-page">
      <div className="booking-hero">
        <div className="booking-hero__media">
          {heroPhoto ? (
            <img src={heroPhoto} alt="" className="booking-hero__photo" />
          ) : (
            <div className="booking-hero__fallback">{sportIcon(court.sport)}</div>
          )}
          <div className="booking-hero__scrim" />
          <Link to={basePath} className="booking-hero__back" aria-label="Voltar pra lojinha">
            ←
          </Link>
          <HeartToggle courtId={court.id} className="booking-hero__favorite" />
          <div className="booking-hero__content">
            <h1>{court.name}</h1>
            {court.reviewCount > 0 && (
              <span className="booking-hero__rating">
                ★ {court.averageRating?.toFixed(1)} · {court.reviewCount} avaliações
              </span>
            )}
          </div>
        </div>

        <div className="booking-hero__tags">
          <span className="pill pill--info">{sportLabel(court.sport)}</span>
          <span className="pill pill--neutral">{surfaceLabel(court.surfaceType)}</span>
          {court.hasLighting && <span className="pill pill--neutral">Com iluminação</span>}
        </div>

        {establishmentName && (
          <p className="booking-hero__establishment">
            {establishmentName}
            {court.owner.establishmentAddress ? ` · ${court.owner.establishmentAddress}` : ''}
          </p>
        )}
      </div>

      <section className="booking-section">
        <h2 className="booking-section__title">Escolha o dia</h2>
        <div className="day-pills">
          {days.map((day, index) => {
            const dayOfWeek = day.getDay()
            const active = index === selectedDayIndex
            return (
              <button
                key={day.toISOString()}
                type="button"
                className={`day-pill${active ? ' day-pill--active' : ''}`}
                onClick={() => selectDay(index)}
                aria-pressed={active}
              >
                <span className="day-pill__weekday">{WEEKDAY_SHORT[dayOfWeek]}</span>
                <span className="day-pill__number">{day.getDate()}</span>
              </button>
            )
          })}
        </div>
      </section>

      {durationOptions.length > 1 && (
        <section className="booking-section">
          <h2 className="booking-section__title">Quanto tempo você quer jogar?</h2>
          <div className="duration-pills">
            {durationOptions.map((minutes) => (
              <button
                key={minutes}
                type="button"
                className={`duration-pill${duration === minutes ? ' duration-pill--active' : ''}`}
                onClick={() => selectDuration(minutes)}
                aria-pressed={duration === minutes}
              >
                {formatDuration(minutes)}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="booking-section">
        <h2 className="booking-section__title">Horários · {selectedDayLabel}</h2>
        {dayGrid.length === 0 ? (
          <p className="booking-section__empty">Sem horários disponíveis nesse dia.</p>
        ) : (
          <div className="time-pills">
            {dayGrid.map((cellStart) => {
              const cellEnd = cellStart + court.bookingStepMinutes
              const occupant = findOccupant(
                selectedDay,
                cellStart,
                cellEnd,
                agenda.reservations,
                agenda.maintenanceBlocks,
                agenda.recurringMaintenanceBlocks,
              )

              if (occupant && occupant.type !== 'reservation') return null

              if (occupant?.type === 'reservation') {
                return (
                  <div key={cellStart} className="time-pill time-pill--taken">
                    <span>{formatMinutes(cellStart)}</span>
                    <button
                      type="button"
                      className="time-pill__notify"
                      onClick={() =>
                        setWaitlistSlot({
                          dayDate: selectedDay,
                          dayLabel: selectedDayLabel,
                          startMinute: cellStart,
                          endMinute: cellEnd,
                        })
                      }
                    >
                      Avise-me
                    </button>
                  </div>
                )
              }

              // Só mostra esse início se a duração escolhida couber inteira, sem
              // buraco nem choque com outra reserva, a partir daqui.
              if (!availableStarts.has(cellStart)) return null

              const endMinute = cellStart + duration
              const price = sumPriceForRange(selectedDayOfWeek, cellStart, endMinute, agenda.priceRules) ?? 0
              // pendingSlot é sempre limpo ao trocar de dia/duração, então só precisa comparar o horário.
              const isPending = pendingSlot?.startMinute === cellStart

              return (
                <button
                  key={cellStart}
                  type="button"
                  className={`time-pill${isPending ? ' time-pill--active' : ''}`}
                  onClick={() =>
                    setPendingSlot({
                      dayDate: selectedDay,
                      dayLabel: selectedDayLabel,
                      startMinute: cellStart,
                      endMinute,
                      price,
                    })
                  }
                >
                  {formatMinutes(cellStart)}–{formatMinutes(endMinute)}
                </button>
              )
            })}
          </div>
        )}
      </section>

      {reviews.length > 0 && (
        <section className="booking-section booking-page__reviews">
          <h2 className="booking-section__title">O que os clientes acharam</h2>
          <div className="booking-page__reviews-list">
            {reviews.map((review) => (
              <div className="booking-review" key={review.id}>
                <div className="booking-review__header">
                  <span className="booking-review__stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                  <span className="booking-review__author">{review.player.name ?? 'Jogador'}</span>
                </div>
                {review.comment && <p className="booking-review__comment">{review.comment}</p>}
                {review.ownerReply && (
                  <div className="booking-review__reply">
                    <span className="booking-review__reply-label">Resposta do estabelecimento</span>
                    <p>{review.ownerReply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {pendingSlot && (
        <div className="booking-summary-bar">
          <div className="booking-summary-bar__info">
            <strong>
              {pendingSlot.dayLabel} · {formatMinutes(pendingSlot.startMinute)}–{formatMinutes(pendingSlot.endMinute)}
            </strong>
            <span>R$ {pendingSlot.price.toFixed(2).replace('.', ',')}</span>
          </div>
          <button type="button" className="btn btn--primary" onClick={confirmPendingSlot}>
            Reservar agora
          </button>
        </div>
      )}

      {selectedSlot && courtId && slug && (
        <BookingFlowModal
          courtId={courtId}
          courtName={court.name}
          establishmentName={establishmentName}
          slug={slug}
          dayLabel={selectedSlot.dayLabel}
          dayDate={selectedSlot.dayDate}
          startMinute={selectedSlot.startMinute}
          endMinute={selectedSlot.endMinute}
          price={selectedSlot.price}
          onClose={() => setSelectedSlot(null)}
          onBooked={() => {
            setPendingSlot(null)
            load()
          }}
        />
      )}

      {waitlistSlot && courtId && (
        <WaitlistJoinModal
          courtId={courtId}
          courtName={court.name}
          dayLabel={waitlistSlot.dayLabel}
          dayDate={waitlistSlot.dayDate}
          startMinute={waitlistSlot.startMinute}
          endMinute={waitlistSlot.endMinute}
          onClose={() => setWaitlistSlot(null)}
        />
      )}
    </div>
  )
}
