import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useEscapeToClose } from '../../hooks/useEscapeToClose'
import { SessionExpiredError } from '../../lib/api'
import { fetchCourts } from '../../lib/courts'
import type { Court } from '../../lib/courts'
import { fetchAgenda } from '../../lib/reservations'
import type { Reservation } from '../../lib/reservations'
import {
  addDays,
  formatMinutes,
  getAvailableStartTimes,
  getBookableEndOptions,
  startOfWeek,
  toDateInputValue,
} from '../../lib/weekGrid'
import DayGrid from './DayGrid'
import type { CourtAgenda } from './DayGrid'
import { usePainelContext } from './PainelLayout'
import ReservationActionsModal from './ReservationActionsModal'
import ReservationModal from './ReservationModal'
import './ReservationModal.css'

interface SlotSelection {
  courtAgenda: CourtAgenda
  startMinute: number
}

interface ActiveReservation {
  court: Court
  reservation: Reservation
}

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function parseDateInput(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

interface NewReservationPickerProps {
  data: CourtAgenda[]
  day: Date
  nowMinutes: number | null
  onCancel: () => void
  onContinue: (selection: SlotSelection) => void
}

/** Passo antes do formulário de reserva: escolher a quadra e o horário de início. */
function NewReservationPicker({ data, day, nowMinutes, onCancel, onContinue }: NewReservationPickerProps) {
  useEscapeToClose(onCancel)
  const [courtId, setCourtId] = useState(data[0].court.id)
  const courtAgenda = data.find((item) => item.court.id === courtId) ?? data[0]
  const { court, agenda } = courtAgenda

  const starts = getAvailableStartTimes(
    day.getDay(),
    court.bookingStepMinutes,
    court.bookingStepMinutes,
    agenda.priceRules,
    day,
    agenda.reservations,
    agenda.maintenanceBlocks,
    agenda.recurringMaintenanceBlocks,
  ).filter((start) => nowMinutes === null || start > nowMinutes)

  const [startMinute, setStartMinute] = useState<number | null>(null)
  const chosen = startMinute !== null && starts.includes(startMinute) ? startMinute : (starts[0] ?? null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (chosen === null) return
    onContinue({ courtAgenda, startMinute: chosen })
  }

  return (
    <div className="reservation-modal__overlay" onClick={onCancel}>
      <div className="reservation-modal" role="dialog" aria-modal="true" aria-labelledby="new-reservation-title" onClick={(event) => event.stopPropagation()}>
        <button className="reservation-modal__close" onClick={onCancel} aria-label="Fechar" type="button">
          ×
        </button>
        <h2 id="new-reservation-title">Nova reserva</h2>
        <p className="reservation-modal__slot">Escolha a quadra e o horário. Depois você preenche os dados do cliente.</p>

        <form onSubmit={handleSubmit} className="reservation-modal__form">
          <label className="reservation-modal__field field">
            <span>Quadra</span>
            <select className="input" value={court.id} onChange={(event) => setCourtId(event.target.value)}>
              {data.map((item) => (
                <option key={item.court.id} value={item.court.id}>
                  {item.court.name}
                </option>
              ))}
            </select>
          </label>

          <label className="reservation-modal__field field">
            <span>Horário de início</span>
            <select
              className="input"
              value={chosen ?? ''}
              onChange={(event) => setStartMinute(Number(event.target.value))}
              disabled={starts.length === 0}
            >
              {starts.length === 0 && <option value="">Sem horário livre neste dia</option>}
              {starts.map((start) => (
                <option key={start} value={start}>
                  {formatMinutes(start)}
                </option>
              ))}
            </select>
          </label>

          <div className="reservation-modal__actions">
            <button className="btn btn--primary" type="submit" disabled={chosen === null}>
              Continuar
            </button>
            <button className="btn btn--outline" type="button" onClick={onCancel}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/** Cartão "Grade do dia" da tela Hoje: navegação de dia, grade, nova reserva e os modais de reserva. */
export default function DayGridCard() {
  const { onSessionExpired } = usePainelContext()
  const [day, setDay] = useState(startOfToday)
  const [data, setData] = useState<CourtAgenda[] | null>(null)
  const [error, setError] = useState('')
  const [selection, setSelection] = useState<SlotSelection | null>(null)
  const [active, setActive] = useState<ActiveReservation | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [now, setNow] = useState(() => new Date())
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
      setError(err instanceof Error ? err.message : 'Não foi possível carregar a grade do dia')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStartValue])

  // A linha de "agora" anda a cada minuto.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  function handleChanged() {
    setSelection(null)
    setActive(null)
    load()
  }

  const isToday = day.toDateString() === now.toDateString()
  const nowMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : null
  const dayLabel = day.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <section className="panel-card day-grid-card" aria-labelledby="day-grid-title">
      <div className="panel-card__head day-grid-card__head">
        <div>
          <h2 id="day-grid-title">Grade do dia</h2>
          <p className="day-grid-card__day">{dayLabel}</p>
        </div>

        <div className="day-grid-card__controls">
          <button className="btn btn--outline btn--sm" type="button" onClick={() => setDay((d) => addDays(d, -1))} aria-label="Dia anterior">
            ‹
          </button>
          <button className="btn btn--outline btn--sm" type="button" onClick={() => setDay(startOfToday())} disabled={isToday}>
            Hoje
          </button>
          <button className="btn btn--outline btn--sm" type="button" onClick={() => setDay((d) => addDays(d, 1))} aria-label="Próximo dia">
            ›
          </button>
          <input
            className="input input--sm day-grid-card__date"
            type="date"
            aria-label="Ir para a data"
            value={toDateInputValue(day)}
            onChange={(event) => event.target.value && setDay(parseDateInput(event.target.value))}
          />
          <button
            className="btn btn--primary btn--sm"
            type="button"
            onClick={() => setPickerOpen(true)}
            disabled={!data || data.length === 0}
          >
            + Nova reserva
          </button>
        </div>
      </div>

      {error && <p className="day-grid-card__message day-grid-card__message--error">{error}</p>}

      {!error && !data && <div className="skeleton day-grid-card__skeleton" aria-label="Carregando a grade do dia" />}

      {data && data.length === 0 && (
        <div className="empty-state">
          <p>Você ainda não tem nenhuma quadra ativa.</p>
          <Link to="/painel/quadras">Cadastrar a primeira quadra</Link>
        </div>
      )}

      {data && data.length > 0 && (
        <DayGrid
          data={data}
          day={day}
          nowMinutes={nowMinutes}
          onPickSlot={(courtAgenda, startMinute) => setSelection({ courtAgenda, startMinute })}
          onPickReservation={(court, reservation) => setActive({ court, reservation })}
        />
      )}

      {pickerOpen && data && data.length > 0 && (
        <NewReservationPicker
          data={data}
          day={day}
          nowMinutes={nowMinutes}
          onCancel={() => setPickerOpen(false)}
          onContinue={(picked) => {
            setPickerOpen(false)
            setSelection(picked)
          }}
        />
      )}

      {selection && (
        <ReservationModal
          courtId={selection.courtAgenda.court.id}
          dayDate={day}
          dayOfWeek={day.getDay()}
          startMinute={selection.startMinute}
          endOptions={getBookableEndOptions(
            day.getDay(),
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
    </section>
  )
}
