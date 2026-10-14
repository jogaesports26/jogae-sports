import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { SPORT_OPTIONS } from '../../lib/courts'
import type { Court } from '../../lib/courts'
import type { AgendaResponse, Reservation } from '../../lib/reservations'
import { buildLaneItems } from '../../lib/dayGridRuns'
import { buildAgendaGridRows, formatMinutes, getAgendaCellState } from '../../lib/weekGrid'
import './DayGrid.css'

export interface CourtAgenda {
  court: Court
  agenda: AgendaResponse
}

interface DayGridProps {
  data: CourtAgenda[]
  day: Date
  /** Minutos desde 00:00 se o dia mostrado é hoje; null nos outros dias (sem linha de "agora"). */
  nowMinutes: number | null
  onPickSlot: (courtAgenda: CourtAgenda, startMinute: number) => void
  onPickReservation: (court: Court, reservation: Reservation) => void
}

const sportLabel = (value: string) => SPORT_OPTIONS.find((option) => option.value === value)?.label ?? value

const STATUS_LABEL: Record<Reservation['status'], string> = {
  CONFIRMED: 'confirmada',
  CANCELLED: 'cancelada',
  COMPLETED: 'concluída',
  NO_SHOW: 'não compareceu',
}

/**
 * A "grade do dia": cada quadra é uma linha e cada hora uma coluna. Reservas e manutenções
 * viram blocos que ocupam as horas seguidas, e uma linha marca o "agora".
 */
export default function DayGrid({ data, day, nowMinutes, onPickSlot, onPickReservation }: DayGridProps) {
  const dayOfWeek = day.getDay()
  const rows = buildAgendaGridRows(
    data.flatMap((item) => item.agenda.priceRules),
    data.flatMap((item) => item.agenda.recurringMaintenanceBlocks),
  )
  const firstMinute = rows[0].startMinute
  const lastMinute = rows[rows.length - 1].endMinute
  const nowFraction =
    nowMinutes !== null && nowMinutes >= firstMinute && nowMinutes <= lastMinute
      ? (nowMinutes - firstMinute) / (lastMinute - firstMinute)
      : null

  // Em telas estreitas a grade rola na horizontal: ao abrir (ou trocar de dia) leva a vista até o "agora"
  // ou, em outro dia, até a primeira reserva, em vez de começar às 6h da manhã.
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const focusKey = `${day.toDateString()}-${data.length}`
  const firstReservationFraction = (() => {
    const starts = data.flatMap((item) =>
      item.agenda.reservations
        .filter((r) => r.status !== 'CANCELLED' && new Date(r.startsAt).toDateString() === day.toDateString())
        .map((r) => new Date(r.startsAt).getHours() * 60 + new Date(r.startsAt).getMinutes()),
    )
    return starts.length > 0 ? (Math.min(...starts) - firstMinute) / (lastMinute - firstMinute) : 0
  })()
  const focusFraction = nowFraction ?? firstReservationFraction
  const focusFractionRef = useRef(focusFraction)
  useEffect(() => {
    focusFractionRef.current = focusFraction
  })

  useEffect(() => {
    const scroller = scrollRef.current
    if (!scroller) return
    const inner = scroller.firstElementChild as HTMLElement | null
    if (!inner || inner.scrollWidth <= scroller.clientWidth) return
    const labelWidth = parseFloat(getComputedStyle(scroller.parentElement ?? scroller).getPropertyValue('--label-w')) || 132
    const target = labelWidth + focusFractionRef.current * (inner.scrollWidth - labelWidth)
    scroller.scrollLeft = Math.max(0, target - scroller.clientWidth * 0.4)
  }, [focusKey])

  // Estados de cada quadra, calculados antes de desenhar: a legenda só mostra o que existe nesta tela.
  const lanes = data.map((courtAgenda) => {
    const { agenda } = courtAgenda
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
    return { courtAgenda, items: buildLaneItems(states) }
  })
  // Mesma regra do servidor e da agenda: horário que já começou não aceita reserva (a hora corrente também sai; "Nova reserva" oferece os meios-horários que restam).
  const isPastRow = (index: number) => nowMinutes !== null && rows[index].startMinute <= nowMinutes
  const seen = {
    completed: false,
    noShow: false,
    blocked: false,
    off: false,
    past: false,
  }
  for (const { items } of lanes) {
    for (const item of items) {
      if (item.kind === 'reserved') {
        if (item.reservation.status === 'COMPLETED') seen.completed = true
        if (item.reservation.status === 'NO_SHOW') seen.noShow = true
      } else if (item.kind === 'blocked') seen.blocked = true
      else if (item.kind === 'noPrice') seen.off = true
      else if (item.kind === 'available' && isPastRow(item.start)) seen.past = true
    }
  }

  return (
    <div className="day-grid" style={{ '--cols': rows.length } as CSSProperties}>
      <ul className="day-grid__legend" aria-label="Legenda">
        <li><i className="day-grid__swatch day-grid__swatch--reserved" />Reservado</li>
        {seen.completed && <li><i className="day-grid__swatch day-grid__swatch--done" />✓ Concluída</li>}
        {seen.noShow && <li><i className="day-grid__swatch day-grid__swatch--noshow" />✕ Faltou</li>}
        {seen.blocked && <li><i className="day-grid__swatch day-grid__swatch--blocked" />Manutenção</li>}
        <li><i className="day-grid__swatch day-grid__swatch--free" />Livre</li>
        {seen.past && <li><i className="day-grid__swatch day-grid__swatch--past" />Já passou</li>}
        {seen.off && <li><i className="day-grid__swatch day-grid__swatch--off" />Sem preço</li>}
      </ul>

      <div className="day-grid__scroll" ref={scrollRef}>
        <div className="day-grid__inner" role="group" aria-label="Grade do dia">
          <div className="day-grid__row day-grid__row--head" aria-hidden="true">
            <span />
            <div className="day-grid__cells">
              {rows.map((row) => (
                <span
                  key={row.startMinute}
                  className={`day-grid__hour${nowMinutes !== null && nowMinutes >= row.startMinute && nowMinutes < row.endMinute ? ' is-now' : ''}`}
                >
                  {row.startMinute / 60}h
                </span>
              ))}
            </div>
          </div>

          {lanes.map(({ courtAgenda, items }) => {
            const { court } = courtAgenda

            return (
              <div className="day-grid__row" key={court.id} role="group" aria-label={court.name}>
                <Link
                  to={`/painel/quadras/${court.id}/agenda`}
                  className="day-grid__label"
                  title="Abrir a agenda da semana desta quadra"
                >
                  <strong>{court.name}</strong>
                  <small>{sportLabel(court.sport)}</small>
                </Link>

                <div className="day-grid__cells">
                  {items.map((item) => {
                    const placement = { gridColumn: `${item.start + 1} / span ${item.span}` }

                    if (item.kind === 'reserved') {
                      const { reservation } = item
                      const start = formatMinutes(
                        new Date(reservation.startsAt).getHours() * 60 + new Date(reservation.startsAt).getMinutes(),
                      )
                      const end = formatMinutes(
                        new Date(reservation.endsAt).getHours() * 60 + new Date(reservation.endsAt).getMinutes(),
                      )
                      return (
                        <button
                          key={`${item.start}-r`}
                          type="button"
                          className={`day-grid__block day-grid__block--${reservation.status.toLowerCase()}`}
                          style={placement}
                          onClick={() => onPickReservation(court, reservation)}
                          aria-label={`${reservation.guestName || 'Reservado'}, ${court.name}, ${start} às ${end}, ${STATUS_LABEL[reservation.status]}`}
                          title={`${reservation.guestName || 'Reservado'} · ${start}–${end}`}
                        >
                          {reservation.status === 'COMPLETED' && <span aria-hidden="true">✓ </span>}
                          {reservation.status === 'NO_SHOW' && <span aria-hidden="true">✕ </span>}
                          {(reservation.guestName || 'Reservado').split(' ')[0]}
                        </button>
                      )
                    }

                    if (item.kind === 'blocked') {
                      return (
                        <span key={`${item.start}-b`} className="day-grid__block day-grid__block--blocked" style={placement}>
                          Manutenção
                        </span>
                      )
                    }

                    if (item.kind === 'noPrice') {
                      return <span key={`${item.start}-n`} className="day-grid__off" style={placement} aria-hidden="true" />
                    }

                    const row = rows[item.start]
                    if (isPastRow(item.start)) {
                      return <span key={`${item.start}-p`} className="day-grid__slot day-grid__slot--past" style={placement} aria-hidden="true" />
                    }

                    return (
                      <button
                        key={`${item.start}-a`}
                        type="button"
                        className="day-grid__slot"
                        style={placement}
                        onClick={() => onPickSlot(courtAgenda, row.startMinute)}
                        aria-label={`Reservar ${court.name} às ${formatMinutes(row.startMinute)}`}
                      >
                        +
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {nowFraction !== null && nowMinutes !== null && (
            <div
              className="day-grid__now"
              style={{ left: `calc(var(--label-w) + (100% - var(--label-w)) * ${nowFraction})` }}
              aria-hidden="true"
            >
              <span>{formatMinutes(nowMinutes)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
