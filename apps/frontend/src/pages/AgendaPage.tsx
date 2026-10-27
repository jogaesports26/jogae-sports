import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCourtDetailContext } from '../components/panel/CourtDetailLayout'
import { SessionExpiredError } from '../lib/api'
import { buildLaneItems } from '../lib/dayGridRuns'
import { fetchAgenda } from '../lib/reservations'
import type { AgendaResponse, Reservation } from '../lib/reservations'
import {
  addDays,
  buildAgendaGridRows,
  formatMinutes,
  getAgendaCellState,
  getBookableEndOptions,
  isSlotInPast,
  startOfWeek,
  toDateInputValue,
  WEEKDAY_SHORT,
} from '../lib/weekGrid'
import AgendaLegend from '../components/panel/AgendaLegend'
import ReservationModal from '../components/panel/ReservationModal'
import ReservationActionsModal from '../components/panel/ReservationActionsModal'
import './AgendaPage.css'

const STATUS_LABEL: Record<Reservation['status'], string> = {
  CONFIRMED: 'confirmada',
  CANCELLED: 'cancelada',
  COMPLETED: 'concluída',
  NO_SHOW: 'não compareceu',
}

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
  // "Agora" da tela: horários que já começaram deixam de aceitar reserva sem precisar recarregar a página.
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  const latestRequestRef = useRef(0)
  const wrapRef = useRef<HTMLDivElement | null>(null)

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

  // No celular a grade rola de lado: ao abrir (ou trocar de semana) leva a vista até a coluna de hoje.
  const hasAgenda = agenda !== null
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const today = wrap.querySelector<HTMLElement>('.agenda-grid__day-header--today')
    wrap.scrollLeft = today && wrap.scrollWidth > wrap.clientWidth ? Math.max(0, today.offsetLeft - 60) : 0
  }, [hasAgenda, weekStart])

  function handleChanged() {
    setSelection(null)
    setActiveReservation(null)
    load()
  }

  if (error) return <p className="agenda-page__error">{error}</p>
  if (!agenda) return <p className="agenda-page__loading">Carregando agenda...</p>

  const rows = buildAgendaGridRows(agenda.priceRules, agenda.recurringMaintenanceBlocks)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const todayIndex = days.findIndex((day) => day.toDateString() === now.toDateString())
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const firstMinute = rows[0].startMinute
  const lastMinute = rows[rows.length - 1].endMinute
  const nowFraction =
    todayIndex >= 0 && nowMinutes >= firstMinute && nowMinutes <= lastMinute
      ? (nowMinutes - firstMinute) / (lastMinute - firstMinute)
      : null
  const isCurrentWeek = todayIndex >= 0

  // Um bloco por reserva ou manutenção (horas seguidas viram uma peça só), igual à grade do dia.
  const columns = days.map((day) => {
    const dayOfWeek = day.getDay()
    const states = rows.map((row) =>
      getAgendaCellState(
        dayOfWeek,
        row,
        agenda.priceRules,
        day,
        agenda.reservations,
        agenda.maintenanceBlocks,
        agenda.recurringMaintenanceBlocks,
      ),
    )
    return { day, dayOfWeek, items: buildLaneItems(states) }
  })
  const clock = (iso: string) => {
    const d = new Date(iso)
    return formatMinutes(d.getHours() * 60 + d.getMinutes())
  }
  const rangeLabel = `${days[0].toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} a ${days[6].toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`

  return (
    <div className="agenda-page">
      <div className="agenda-page__toolbar">
        <div className="agenda-page__week-nav">
          <button type="button" onClick={() => setWeekStart((d) => addDays(d, -7))} aria-label="Semana anterior">
            ‹
          </button>
          <button type="button" onClick={() => setWeekStart(startOfWeek(new Date()))} disabled={isCurrentWeek}>
            Esta semana
          </button>
          <button type="button" onClick={() => setWeekStart((d) => addDays(d, 7))} aria-label="Próxima semana">
            ›
          </button>
          <strong className="agenda-page__range">{rangeLabel}</strong>
        </div>
        <AgendaLegend pricingHref={`/painel/quadras/${courtId}/precos`} />
      </div>

      {agenda.priceRules.length === 0 && (
        <div className="agenda-page__hint card">
          <p>Você ainda não cadastrou nenhum preço — a grade abaixo mostra o dia inteiro, mas nenhum horário pode ser reservado até você configurar os preços.</p>
          <Link to={`/painel/quadras/${courtId}/precos`} className="btn btn--primary btn--sm">
            Configurar preços
          </Link>
        </div>
      )}

      <div className="agenda-grid__wrap" ref={wrapRef}>
        <div
          className="agenda-grid"
          role="group"
          aria-label="Agenda da semana"
          style={{ '--rows': rows.length } as CSSProperties}
        >
          {days.map((day, index) => {
            const isToday = index === todayIndex
            return (
              <div
                className={`agenda-grid__day-header${isToday ? ' agenda-grid__day-header--today' : ''}`}
                style={{ gridColumn: index + 2, gridRow: 1 }}
                key={day.toISOString()}
              >
                <span>{WEEKDAY_SHORT[day.getDay()]}</span>
                <strong>{day.getDate()}</strong>
              </div>
            )
          })}

          {rows.map((row, index) => (
            <div
              className={`agenda-grid__time${todayIndex >= 0 && nowMinutes >= row.startMinute && nowMinutes < row.endMinute ? ' is-now' : ''}`}
              style={{ gridColumn: 1, gridRow: index + 2 }}
              key={row.startMinute}
            >
              {formatMinutes(row.startMinute)}
            </div>
          ))}

          {columns.map(({ day, dayOfWeek, items }, dayIndex) =>
            items.map((item) => {
              const placement = { gridColumn: dayIndex + 2, gridRow: `${item.start + 2} / span ${item.span}` }
              const key = `${dayIndex}-${item.start}-${item.kind}`

              if (item.kind === 'reserved') {
                const { reservation } = item
                const name = reservation.guestName || 'Reservado'
                const range = `${clock(reservation.startsAt)}–${clock(reservation.endsAt)}`
                return (
                  <button
                    type="button"
                    key={key}
                    className={`agenda-grid__block agenda-grid__block--${reservation.status.toLowerCase()}`}
                    style={placement}
                    onClick={() => setActiveReservation(reservation)}
                    aria-label={`${name}, ${range}, ${STATUS_LABEL[reservation.status]}`}
                  >
                    <strong>
                      {reservation.status === 'COMPLETED' && <span aria-hidden="true">✓ </span>}
                      {reservation.status === 'NO_SHOW' && <span aria-hidden="true">✕ </span>}
                      {name}
                    </strong>
                    <span>{range}</span>
                  </button>
                )
              }

              if (item.kind === 'blocked') {
                return (
                  <div className="agenda-grid__block agenda-grid__block--blocked" style={placement} key={key}>
                    Manutenção
                  </div>
                )
              }

              if (item.kind === 'noPrice') {
                return <div className="agenda-grid__cell agenda-grid__cell--off" style={placement} key={key} aria-hidden="true" />
              }

              const startMinute = rows[item.start].startMinute
              if (isSlotInPast(day, startMinute, now)) {
                // Horário livre que já começou: sem botão. Reservas e bloqueios antigos continuam abrindo normalmente.
                return <div className="agenda-grid__cell agenda-grid__cell--past" style={placement} key={key} aria-hidden="true" />
              }

              return (
                <button
                  type="button"
                  className="agenda-grid__cell agenda-grid__cell--available"
                  style={placement}
                  key={key}
                  onClick={() => setSelection({ dayDate: day, dayOfWeek, startMinute })}
                  aria-label={`Reservar ${WEEKDAY_SHORT[dayOfWeek]} ${day.getDate()} às ${formatMinutes(startMinute)}`}
                >
                  +
                </button>
              )
            }),
          )}

          {nowFraction !== null && (
            <div className="agenda-grid__now-track" style={{ gridColumn: todayIndex + 2, gridRow: '2 / -1' }} aria-hidden="true">
              <span className="agenda-grid__now" style={{ top: `${nowFraction * 100}%` }}>
                {formatMinutes(nowMinutes)}
              </span>
            </div>
          )}
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
