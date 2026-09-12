import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchCourtReviews, fetchPublicAgenda, fetchPublicCourt } from '../lib/player'
import type { AgendaResponse } from '../lib/reservations'
import type { CourtReview, PublicCourt } from '../lib/player'
import { SPORT_OPTIONS, SURFACE_OPTIONS } from '../lib/courts'
import { addDays, findOccupant, formatMinutes, toDateInputValue, WEEKDAY_SHORT } from '../lib/weekGrid'
import BookingFlowModal from '../components/portal/BookingFlowModal'
import WaitlistJoinModal from '../components/portal/WaitlistJoinModal'
import './CourtBookingPage.css'

const sportLabel = (value: string) => SPORT_OPTIONS.find((option) => option.value === value)?.label ?? value
const surfaceLabel = (value: string) =>
  SURFACE_OPTIONS.find((option) => option.value === value)?.label ?? value

interface SelectedSlot {
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
  const [court, setCourt] = useState<PublicCourt | null>(null)
  const [agenda, setAgenda] = useState<AgendaResponse | null>(null)
  const [reviews, setReviews] = useState<CourtReview[]>([])
  const [error, setError] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null)
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

  return (
    <div className="booking-page">
      <Link to={`/${slug}`} className="booking-page__back">
        ← Voltar
      </Link>
      <h1>{court.name}</h1>
      <p className="booking-page__meta">
        {sportLabel(court.sport)} · {surfaceLabel(court.surfaceType)}
        {court.hasLighting ? ' · Com iluminação' : ''}
        {court.reviewCount > 0 && (
          <span className="booking-page__rating">
            {' '}
            · ★ {court.averageRating?.toFixed(1)} ({court.reviewCount} avaliações)
          </span>
        )}
      </p>
      {court.owner.establishmentName && (
        <p className="booking-page__establishment">
          {court.owner.establishmentName}
          {court.owner.establishmentAddress ? ` · ${court.owner.establishmentAddress}` : ''}
        </p>
      )}

      <div className="booking-page__days">
        {days.map((day) => {
          const dayOfWeek = day.getDay()
          const dayRules = agenda.priceRules
            .filter((r) => r.dayOfWeek === dayOfWeek)
            .sort((a, b) => a.startMinute - b.startMinute)

          return (
            <div className="booking-day" key={day.toISOString()}>
              <div className="booking-day__header">
                <span>{WEEKDAY_SHORT[dayOfWeek]}</span>
                <strong>{day.getDate()}</strong>
              </div>

              {dayRules.length === 0 ? (
                <p className="booking-day__empty">Sem horários</p>
              ) : (
                <div className="booking-day__slots">
                  {dayRules.map((rule) => {
                    const occupant = findOccupant(
                      day,
                      rule.startMinute,
                      rule.endMinute,
                      agenda.reservations,
                      agenda.maintenanceBlocks,
                      agenda.recurringMaintenanceBlocks,
                    )

                    if (!occupant) {
                      return (
                        <button
                          key={rule.id}
                          className="booking-day__slot"
                          onClick={() =>
                            setSelectedSlot({
                              dayDate: day,
                              dayLabel: `${WEEKDAY_SHORT[dayOfWeek]} ${day.getDate()}`,
                              startMinute: rule.startMinute,
                              endMinute: rule.endMinute,
                              price: Number(rule.pricePerHour) * ((rule.endMinute - rule.startMinute) / 60),
                            })
                          }
                        >
                          {formatMinutes(rule.startMinute)}
                        </button>
                      )
                    }

                    if (occupant.type === 'reservation') {
                      return (
                        <div key={rule.id} className="booking-day__slot booking-day__slot--taken">
                          <span>{formatMinutes(rule.startMinute)}</span>
                          <button
                            type="button"
                            className="booking-day__notify"
                            onClick={() =>
                              setWaitlistSlot({
                                dayDate: day,
                                dayLabel: `${WEEKDAY_SHORT[dayOfWeek]} ${day.getDate()}`,
                                startMinute: rule.startMinute,
                                endMinute: rule.endMinute,
                              })
                            }
                          >
                            Avise-me
                          </button>
                        </div>
                      )
                    }

                    return null
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {reviews.length > 0 && (
        <div className="booking-page__reviews">
          <h2>O que os clientes acharam</h2>
          <div className="booking-page__reviews-list">
            {reviews.map((review) => (
              <div className="booking-review" key={review.id}>
                <div className="booking-review__header">
                  <span className="booking-review__stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                  <span className="booking-review__author">{review.player.name ?? 'Jogador'}</span>
                </div>
                {review.comment && <p className="booking-review__comment">{review.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedSlot && courtId && (
        <BookingFlowModal
          courtId={courtId}
          courtName={court.name}
          dayLabel={selectedSlot.dayLabel}
          dayDate={selectedSlot.dayDate}
          startMinute={selectedSlot.startMinute}
          endMinute={selectedSlot.endMinute}
          price={selectedSlot.price}
          onClose={() => setSelectedSlot(null)}
          onBooked={load}
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
