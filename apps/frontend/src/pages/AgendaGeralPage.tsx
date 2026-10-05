import { Fragment, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePainelContext } from '../components/panel/PainelLayout'
import AgendaLegend from '../components/panel/AgendaLegend'
import ReservationModal from '../components/panel/ReservationModal'
import ReservationActionsModal from '../components/panel/ReservationActionsModal'
import { SessionExpiredError } from '../lib/api'
import { fetchCourts, SPORT_OPTIONS, WEEKDAY_LABELS } from '../lib/courts'
import type { Court } from '../lib/courts'
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
} from '../lib/weekGrid'
import './AgendaPage.css'
import './AgendaGeralPage.css'

interface CourtAgenda {
  court: Court
  agenda: AgendaResponse
}

interface SlotSelection {
  courtAgenda: CourtAgenda
  startMinute: number
}

interface ActiveReservation {
  court: Court
  reservation: Reservation
}

const sportLabel = (value: string) => SPORT_OPTIONS.find((option) => option.value === value)?.label ?? value

function parseDateInput(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatDayTitle(day: Date) {
  return `${WEEKDAY_LABELS[day.getDay()]}, ${day.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}`
}

export default function AgendaGeralPage() {
  const { onSessionExpired } = usePainelContext()

  const [day, setDay] = useState(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  })
  const [data, setData] = useState<CourtAgenda[] | null>(null)
  const [error, setError] = useState('')
  const [selection, setSelection] = useState<SlotSelection | null>(null)
  const [active, setActive] = useState<ActiveReservation | null>(null)
  const latestRequestRef = useRef(0)

  const weekStartValue = toDateInputValue(startOfWeek(day))

  async function load() {
    const requestId = ++latestRequestRef.current
    try {
      const courts = (await fetchCourts()).filter((court) => court.active)
      const agendas = await Promise.all(courts.map((court) => fetchAgenda(court.id, weekStartValue)))
      if (requestId !== latestRequestRef.current) return
      setError('')
      setData(courts.map((court, index) => ({ court, agenda: agendas[index] })))
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
  }, [weekStartValue])

  function handleChanged() {
    setSelection(null)
    setActive(null)
    load()
  }

  if (error) return <p className="agenda-page__error">{error}</p>
  if (!data) return <p className="agenda-page__loading">Carregando agenda...</p>

  const dayOfWeek = day.getDay()
  const isToday = day.toDateString() === new Date().toDateString()
  const rows = buildAgendaGridRows(
    data.flatMap((item) => item.agenda.priceRules),
    data.flatMap((item) => item.agenda.recurringMaintenanceBlocks),
  )

  return (
    <div className="agenda-page agenda-geral">
      <h1 className="agenda-geral__title">Agenda</h1>
      <p className="agenda-page__subtitle">Todas as quadras lado a lado. Clique num horário livre pra criar uma reserva.</p>

      <div className="agenda-page__week-nav agenda-geral__nav">
        <button onClick={() => setDay((d) => addDays(d, -1))}>← Dia anterior</button>
        <button onClick={() => setDay(parseDateInput(toDateInputValue(new Date())))}>Hoje</button>
        <button onClick={() => setDay((d) => addDays(d, 1))}>Próximo dia →</button>
        <input
          className="input input--sm agenda-geral__date"
          type="date"
          aria-label="Ir pra data"
          value={toDateInputValue(day)}
          onChange={(event) => event.target.value && setDay(parseDateInput(event.target.value))}
        />
      </div>

      <h2 className={`agenda-geral__day${isToday ? ' agenda-geral__day--today' : ''}`}>
        {formatDayTitle(day)}
        {isToday && <span className="pill pill--info">Hoje</span>}
      </h2>

      {data.length === 0 ? (
        <div className="agenda-page__hint card">
          <p>Você ainda não tem nenhuma quadra ativa.</p>
          <Link to="/painel/quadras" className="btn btn--primary btn--sm">
            Ir pras quadras
          </Link>
        </div>
      ) : (
        <>
          <AgendaLegend />
          <div className="agenda-grid__wrap">
            <div
              className="agenda-grid"
              style={{ gridTemplateColumns: `88px repeat(${data.length}, minmax(130px, 1fr))` }}
            >
              <div className="agenda-grid__corner" />
              {data.map(({ court }) => (
                <Link
                  key={court.id}
                  to={`/painel/quadras/${court.id}/agenda`}
                  className="agenda-grid__day-header agenda-geral__court-header"
                  title="Abrir agenda da semana dessa quadra"
                >
                  <strong>{court.name}</strong>
                  <span>{sportLabel(court.sport)}</span>
                </Link>
              ))}

              {rows.map((row) => (
                <Fragment key={row.startMinute}>
                  <div className="agenda-grid__time">{formatMinutes(row.startMinute)}</div>
                  {data.map((courtAgenda) => {
                    const { court, agenda } = courtAgenda
                    const cellKey = `${row.startMinute}-${court.id}`
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
                          onClick={() => setActive({ court, reservation: state.reservation })}
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
                        onClick={() => setSelection({ courtAgenda, startMinute: row.startMinute })}
                      >
                        +
                      </button>
                    )
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </>
      )}

      {selection && (
        <ReservationModal
          courtId={selection.courtAgenda.court.id}
          dayDate={day}
          dayOfWeek={dayOfWeek}
          startMinute={selection.startMinute}
          endOptions={getBookableEndOptions(
            dayOfWeek,
            selection.startMinute,
            selection.courtAgenda.court.bookingStepMinutes,
            selection.courtAgenda.agenda.priceRules,
            day,
            selection.courtAgenda.agenda.reservations,
            selection.courtAgenda.agenda.maintenanceBlocks,
            selection.courtAgenda.agenda.recurringMaintenanceBlocks,
          )}
          priceRules={selection.courtAgenda.agenda.priceRules}
          onClose={() => setSelection(null)}
          onCreated={handleChanged}
          onSessionExpired={onSessionExpired}
        />
      )}

      {active && (
        <ReservationActionsModal
          courtId={active.court.id}
          courtName={active.court.name}
          reservation={active.reservation}
          onClose={() => setActive(null)}
          onChanged={handleChanged}
          onSessionExpired={onSessionExpired}
        />
      )}
    </div>
  )
}
