import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import DayGrid from '../components/panel/DayGrid'
import type { CourtAgenda } from '../components/panel/DayGrid'
import { usePainelContext } from '../components/panel/PainelLayout'
import ReservationActionsModal from '../components/panel/ReservationActionsModal'
import ReservationModal from '../components/panel/ReservationModal'
import PageHeader from '../components/panel/PageHeader'
import { SessionExpiredError } from '../lib/api'
import { fetchCourts } from '../lib/courts'
import type { Court } from '../lib/courts'
import { fetchAgenda } from '../lib/reservations'
import type { Reservation } from '../lib/reservations'
import { addDays, getBookableEndOptions, startOfWeek, toDateInputValue, WEEKDAY_SHORT } from '../lib/weekGrid'
import '../components/panel/ReservationModal.css'
import './WeekAgendaPage.css'

interface SlotSelection {
  courtAgenda: CourtAgenda
  startMinute: number
  day: Date
}

function rangeLabel(start: Date) {
  const end = addDays(start, 6)
  const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  return `${fmt(start)} a ${fmt(end)}`
}

/**
 * Agenda da semana de TODAS as quadras juntas: um bloco por dia, cada um com a mesma grade da tela Hoje.
 * Lê as mesmas agendas de cada quadra (não há uma segunda fonte de verdade) e reaproveita os mesmos
 * formulários de reservar e de gerenciar uma reserva.
 */
export default function WeekAgendaPage() {
  const { onSessionExpired } = usePainelContext()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [data, setData] = useState<CourtAgenda[] | null>(null)
  const [error, setError] = useState('')
  const [selection, setSelection] = useState<SlotSelection | null>(null)
  const [active, setActive] = useState<{ court: Court; reservation: Reservation } | null>(null)
  const [now, setNow] = useState(() => new Date())
  const latestRequestRef = useRef(0)
  const weekValue = toDateInputValue(weekStart)

  async function load() {
    const requestId = ++latestRequestRef.current
    try {
      const courts = (await fetchCourts()).filter((court) => court.active)
      const agendas = await Promise.all(courts.map((court) => fetchAgenda(court.id, weekValue)))
      if (requestId !== latestRequestRef.current) return
      setError('')
      setData(courts.map((court, index) => ({ court, agenda: agendas[index] })))
    } catch (err) {
      if (requestId !== latestRequestRef.current) return
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
        return
      }
      setError(err instanceof Error ? err.message : 'Não foi possível carregar a agenda da semana')
    }
  }

  useEffect(() => {
    setData(null)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekValue])

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  function handleChanged() {
    setSelection(null)
    setActive(null)
    load()
  }

  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
  const isCurrentWeek = days.some((day) => day.toDateString() === now.toDateString())

  const countFor = (day: Date) =>
    (data ?? [])
      .flatMap((item) => item.agenda.reservations)
      .filter((r) => r.status !== 'CANCELLED' && new Date(r.startsAt).toDateString() === day.toDateString()).length

  return (
    <div className="week-agenda">
      <PageHeader
        title="Agenda da semana"
        subtitle={`Todas as quadras, de ${rangeLabel(weekStart)}. Toque num horário livre para reservar ou numa reserva para gerenciar.`}
        actions={
          <div className="week-agenda__nav">
            <button type="button" className="btn btn--outline btn--sm" onClick={() => setWeekStart((d) => addDays(d, -7))} aria-label="Semana anterior">
              ‹
            </button>
            <button type="button" className="btn btn--outline btn--sm" onClick={() => setWeekStart(startOfWeek(new Date()))} disabled={isCurrentWeek}>
              Esta semana
            </button>
            <button type="button" className="btn btn--outline btn--sm" onClick={() => setWeekStart((d) => addDays(d, 7))} aria-label="Próxima semana">
              ›
            </button>
          </div>
        }
      />

      <ul className="week-agenda__legend" aria-label="Legenda">
        <li><i className="day-grid__swatch day-grid__swatch--reserved" />Reservado</li>
        <li><i className="day-grid__swatch day-grid__swatch--free" />Livre</li>
        <li><i className="day-grid__swatch day-grid__swatch--blocked" />Manutenção</li>
        <li><i className="day-grid__swatch day-grid__swatch--past" />Já passou</li>
        <li><i className="day-grid__swatch day-grid__swatch--off" />Sem preço</li>
      </ul>

      {error && <p className="week-agenda__error" role="alert">{error}</p>}
      {!error && !data && <div className="skeleton week-agenda__skeleton" aria-label="Carregando a agenda da semana" />}

      {data && data.length === 0 && (
        <div className="empty-state">
          <p>Você ainda não tem nenhuma quadra ativa.</p>
          <Link to="/painel/quadras">Cadastrar a primeira quadra</Link>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="week-agenda__days">
          {days.map((day) => {
            const count = countFor(day)
            const isToday = day.toDateString() === now.toDateString()
            const isPast = day.getTime() < today.getTime()
            return (
              <details key={day.toISOString()} className={`week-day panel-card${isToday ? ' week-day--today' : ''}`} open={!isPast}>
                <summary className="week-day__summary">
                  <span className="week-day__title">
                    {WEEKDAY_SHORT[day.getDay()]} {day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                  {isToday && <span className="pill pill--info">Hoje</span>}
                  <span className="week-day__count">
                    {count === 0 ? 'Sem reservas' : `${count} ${count === 1 ? 'reserva' : 'reservas'}`}
                  </span>
                </summary>
                <DayGrid
                  data={data}
                  day={day}
                  nowMinutes={isToday ? now.getHours() * 60 + now.getMinutes() : null}
                  showLegend={false}
                  onPickSlot={(courtAgenda, startMinute) => setSelection({ courtAgenda, startMinute, day })}
                  onPickReservation={(court, reservation) => setActive({ court, reservation })}
                />
              </details>
            )
          })}
        </div>
      )}

      {selection && (
        <ReservationModal
          courtId={selection.courtAgenda.court.id}
          dayDate={selection.day}
          dayOfWeek={selection.day.getDay()}
          startMinute={selection.startMinute}
          endOptions={getBookableEndOptions(
            selection.day.getDay(),
            selection.startMinute,
            selection.courtAgenda.court.bookingStepMinutes,
            selection.courtAgenda.agenda.priceRules,
            selection.day,
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
