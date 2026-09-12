import { Fragment, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useCourtDetailContext } from '../components/panel/CourtDetailLayout'
import { SessionExpiredError } from '../lib/api'
import { fetchAgenda } from '../lib/reservations'
import type { AgendaResponse, Reservation } from '../lib/reservations'
import {
  addDays,
  buildGridRows,
  findOccupant,
  formatMinutes,
  getBookableEndOptions,
  startOfWeek,
  toDateInputValue,
  WEEKDAY_SHORT,
} from '../lib/weekGrid'
import ReservationModal from '../components/panel/ReservationModal'
import ReservationActionsModal from '../components/panel/ReservationActionsModal'
import './AgendaPage.css'

interface SlotSelection {
  dayDate: Date
  dayOfWeek: number
  startMinute: number
}

export default function AgendaPage() {
  const { courtId } = useParams<{ courtId: string }>()
  const { onSessionExpired } = useCourtDetailContext()

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [agenda, setAgenda] = useState<AgendaResponse | null>(null)
  const [error, setError] = useState('')
  const [selection, setSelection] = useState<SlotSelection | null>(null)
  const [activeReservation, setActiveReservation] = useState<Reservation | null>(null)
  const latestRequestRef = useRef(0)

  async function load() {
    if (!courtId) return
    const requestId = ++latestRequestRef.current
    try {
      const agendaData = await fetchAgenda(courtId, toDateInputValue(weekStart))
      // Descarta a resposta se outra chamada a `load` (troca de semana, ou o
      // reload depois de criar/cancelar uma reserva) começou depois desta —
      // sem isso, a resposta mais lenta podia chegar por último e sobrescrever
      // o estado com os dados de uma semana errada.
      if (requestId !== latestRequestRef.current) return
      setAgenda(agendaData)
    } catch (err) {
      if (requestId !== latestRequestRef.current) return
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
        return
      }
      setError(err instanceof Error ? err.message : 'Erro ao carregar a agenda')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courtId, weekStart])

  function handleChanged() {
    setSelection(null)
    setActiveReservation(null)
    load()
  }

  if (error) return <p className="agenda-page__error">{error}</p>
  if (!agenda) return <p className="agenda-page__loading">Carregando agenda...</p>

  const rows = buildGridRows(agenda.priceRules)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="agenda-page">
      <p className="agenda-page__subtitle">Clique num horário livre pra criar uma reserva.</p>

      <div className="agenda-page__week-nav">
        <button onClick={() => setWeekStart((d) => addDays(d, -7))}>← Semana anterior</button>
        <button onClick={() => setWeekStart(startOfWeek(new Date()))}>Hoje</button>
        <button onClick={() => setWeekStart((d) => addDays(d, 7))}>Próxima semana →</button>
      </div>

      {rows.length === 0 ? (
        <p className="agenda-page__empty">
          Essa quadra ainda não tem preços por horário configurados. Configure na aba "Preços &
          disponibilidade" antes de lançar reservas.
        </p>
      ) : (
        <div className="agenda-grid__wrap">
          <div className="agenda-grid" style={{ gridTemplateColumns: `88px repeat(7, 1fr)` }}>
            <div className="agenda-grid__corner" />
            {days.map((day) => (
              <div className="agenda-grid__day-header" key={day.toISOString()}>
                <span>{WEEKDAY_SHORT[day.getDay()]}</span>
                <strong>{day.getDate()}</strong>
              </div>
            ))}

            {rows.map((row) => (
              <Fragment key={row.key}>
                <div className="agenda-grid__time">
                  {formatMinutes(row.startMinute)}
                </div>
                {days.map((day) => {
                  const dayOfWeek = day.getDay()
                  const hasRule = agenda.priceRules.some(
                    (r) => r.dayOfWeek === dayOfWeek && r.startMinute === row.startMinute && r.endMinute === row.endMinute,
                  )

                  if (!hasRule) {
                    return <div className="agenda-grid__cell agenda-grid__cell--off" key={`${row.key}-${dayOfWeek}`} />
                  }

                  const occupant = findOccupant(
                    day,
                    row.startMinute,
                    row.endMinute,
                    agenda.reservations,
                    agenda.maintenanceBlocks,
                    agenda.recurringMaintenanceBlocks,
                  )

                  if (occupant?.type === 'reservation' && occupant.reservation) {
                    const isStart = new Date(occupant.reservation.startsAt).getHours() * 60 +
                      new Date(occupant.reservation.startsAt).getMinutes() === row.startMinute
                    return (
                      <button
                        className="agenda-grid__cell agenda-grid__cell--reserved"
                        key={`${row.key}-${dayOfWeek}`}
                        onClick={() => setActiveReservation(occupant.reservation!)}
                      >
                        {isStart ? occupant.reservation.guestName : ''}
                      </button>
                    )
                  }

                  if (occupant?.type === 'block' || occupant?.type === 'recurringBlock') {
                    return (
                      <div className="agenda-grid__cell agenda-grid__cell--blocked" key={`${row.key}-${dayOfWeek}`}>
                        Manutenção
                      </div>
                    )
                  }

                  return (
                    <button
                      className="agenda-grid__cell agenda-grid__cell--available"
                      key={`${row.key}-${dayOfWeek}`}
                      onClick={() => setSelection({ dayDate: day, dayOfWeek, startMinute: row.startMinute })}
                    >
                      +
                    </button>
                  )
                })}
              </Fragment>
            ))}
          </div>
        </div>
      )}

      {selection && courtId && (
        <ReservationModal
          courtId={courtId}
          dayDate={selection.dayDate}
          dayOfWeek={selection.dayOfWeek}
          startMinute={selection.startMinute}
          endOptions={getBookableEndOptions(
            selection.dayOfWeek,
            selection.startMinute,
            agenda.priceRules,
            selection.dayDate,
            agenda.reservations,
            agenda.maintenanceBlocks,
            agenda.recurringMaintenanceBlocks,
          )}
          priceRules={agenda.priceRules}
          onClose={() => setSelection(null)}
          onCreated={handleChanged}
          onSessionExpired={onSessionExpired}
        />
      )}

      {activeReservation && courtId && (
        <ReservationActionsModal
          courtId={courtId}
          reservation={activeReservation}
          onClose={() => setActiveReservation(null)}
          onChanged={handleChanged}
          onSessionExpired={onSessionExpired}
        />
      )}
    </div>
  )
}
