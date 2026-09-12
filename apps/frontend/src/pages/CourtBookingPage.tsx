import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchPublicAgenda, fetchPublicCourt } from '../lib/player'
import type { AgendaResponse } from '../lib/reservations'
import type { PublicCourt } from '../lib/player'
import { SPORT_OPTIONS, SURFACE_OPTIONS } from '../lib/courts'
import { addDays, findOccupant, formatMinutes, toDateInputValue, WEEKDAY_SHORT } from '../lib/weekGrid'
import BookingFlowModal from '../components/portal/BookingFlowModal'
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

export default function CourtBookingPage() {
  const { courtId } = useParams<{ courtId: string }>()
  const [court, setCourt] = useState<PublicCourt | null>(null)
  const [agenda, setAgenda] = useState<AgendaResponse | null>(null)
  const [error, setError] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null)

  async function load() {
    if (!courtId) return
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const [courtData, agendaData] = await Promise.all([
        fetchPublicCourt(courtId),
        fetchPublicAgenda(courtId, toDateInputValue(today)),
      ])
      setCourt(courtData)
      setAgenda(agendaData)
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
      <h1>{court.name}</h1>
      <p className="booking-page__meta">
        {sportLabel(court.sport)} · {surfaceLabel(court.surfaceType)}
        {court.hasLighting ? ' · Com iluminação' : ''}
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

          const availableSlots = dayRules.filter(
            (rule) =>
              !findOccupant(day, rule.startMinute, rule.endMinute, agenda.reservations, agenda.maintenanceBlocks),
          )

          return (
            <div className="booking-day" key={day.toISOString()}>
              <div className="booking-day__header">
                <span>{WEEKDAY_SHORT[dayOfWeek]}</span>
                <strong>{day.getDate()}</strong>
              </div>

              {availableSlots.length === 0 ? (
                <p className="booking-day__empty">Sem horários</p>
              ) : (
                <div className="booking-day__slots">
                  {availableSlots.map((rule) => (
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
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

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
    </div>
  )
}
