import { Fragment, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCourtDetailContext } from '../components/panel/CourtDetailLayout'
import { SessionExpiredError } from '../lib/api'
import { fetchAgenda } from '../lib/reservations'
import type { AgendaResponse, Reservation } from '../lib/reservations'
import {
  addDays,
  buildAgendaGridRows,
  formatMinutes,
  getAgendaCellState,
  getBookableEndOptions,
  startOfWeek,
  toDateInputValue,
  WEEKDAY_SHORT,
} from '../lib/weekGrid'
import AgendaLegend from '../components/panel/AgendaLegend'
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
  const { court, onSessionExpired } = useCourtDetailContext()

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

  const rows = buildAgendaGridRows(agenda.priceRules, agenda.recurringMaintenanceBlocks)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const today = new Date()

  return (
    <div className="agenda-page">
      <p className="agenda-page__subtitle">Clique num horário livre pra criar uma reserva.</p>

      <div className="agenda-page__week-nav">
        <button onClick={() => setWeekStart((d) => addDays(d, -7))}>← Semana anterior</button>
        <button onClick={() => setWeekStart(startOfWeek(new Date()))}>Hoje</button>
        <button onClick={() => setWeekStart((d) => addDays(d, 7))}>Próxima semana →</button>
      </div>

      {agenda.priceRules.length === 0 && (
        <div className="agenda-page__hint card">
          <p>Você ainda não cadastrou nenhum preço — a grade abaixo mostra o dia inteiro, mas nenhum horário pode ser reservado até você configurar os preços.</p>
          <Link to={`/painel/quadras/${courtId}/precos`} className="btn btn--primary btn--sm">
            Configurar preços
          </Link>
        </div>
      )}

      <AgendaLegend pricingHref={`/painel/quadras/${courtId}/precos`} />
      <div className="agenda-grid__wrap">
        <div className="agenda-grid" style={{ gridTemplateColumns: `88px repeat(7, 1fr)` }}>
          <div className="agenda-grid__corner" />
          {days.map((day) => {
            const isToday = day.toDateString() === today.toDateString()
            return (
              <div
                className={`agenda-grid__day-header${isToday ? ' agenda-grid__day-header--today' : ''}`}
                key={day.toISOString()}
              >
                <span>{WEEKDAY_SHORT[day.getDay()]}</span>
                <strong>{day.getDate()}</strong>
              </div>
            )
          })}

          {rows.map((row) => (
            <Fragment key={row.startMinute}>
              <div className="agenda-grid__time">{formatMinutes(row.startMinute)}</div>
              {days.map((day) => {
                const dayOfWeek = day.getDay()
                const cellKey = `${row.startMinute}-${dayOfWeek}`
                const state = getAgendaCellState(
                  dayOfWeek,
                  row,
                  agenda.priceRules,
                  day,
                  agenda.reservations,
                  agenda.maintenanceBlocks,
                  agenda.recurringMaintenanceBlocks,
                )

                if (state.kind === 'reserved') {
                  return (
                    <button
                      className="agenda-grid__cell agenda-grid__cell--reserved"
                      key={cellKey}
                      onClick={() => setActiveReservation(state.reservation)}
                    >
                      {state.isLabelRow ? state.reservation.guestName || 'Reservado' : ''}
                    </button>
                  )
                }

                if (state.kind === 'blocked') {
                  return (
                    <div className="agenda-grid__cell agenda-grid__cell--blocked" key={cellKey}>
                      Manutenção
                    </div>
                  )
                }

                if (state.kind === 'noPrice') {
                  return <div className="agenda-grid__cell agenda-grid__cell--off" key={cellKey} />
                }

                return (
                  <button
                    className="agenda-grid__cell agenda-grid__cell--available"
                    key={cellKey}
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

      {selection && courtId && (
        <ReservationModal
          courtId={courtId}
          dayDate={selection.dayDate}
          dayOfWeek={selection.dayOfWeek}
          startMinute={selection.startMinute}
          endOptions={getBookableEndOptions(
            selection.dayOfWeek,
            selection.startMinute,
            court.bookingStepMinutes,
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
          courtName={court.name}
          reservation={activeReservation}
          onClose={() => setActiveReservation(null)}
          onChanged={handleChanged}
          onSessionExpired={onSessionExpired}
        />
      )}
    </div>
  )
}
