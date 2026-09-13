import { useState } from 'react'
import { useEscapeToClose } from '../../hooks/useEscapeToClose'
import { SessionExpiredError } from '../../lib/api'
import type { Reservation } from '../../lib/reservations'
import { cancelReservation, rescheduleReservation, updateReservationStatus } from '../../lib/reservations'
import { buildGoogleCalendarUrl } from '../../lib/calendar'
import { showToast } from '../../lib/toast'
import './ReservationModal.css'

function toDatetimeLocalValue(date: Date): string {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

const STATUS_LABELS: Record<Reservation['status'], string> = {
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Concluída',
  NO_SHOW: 'Não compareceu',
}

interface ReservationActionsModalProps {
  courtId: string
  courtName: string
  reservation: Reservation
  onClose: () => void
  onChanged: () => void
  onSessionExpired: () => void
}

export default function ReservationActionsModal({
  courtId,
  courtName,
  reservation,
  onClose,
  onChanged,
  onSessionExpired,
}: ReservationActionsModalProps) {
  useEscapeToClose(onClose)
  const [isSaving, setIsSaving] = useState(false)
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [newStartsAt, setNewStartsAt] = useState('')
  const [newEndsAt, setNewEndsAt] = useState('')

  function startRescheduling() {
    setNewStartsAt(toDatetimeLocalValue(new Date(reservation.startsAt)))
    setNewEndsAt(toDatetimeLocalValue(new Date(reservation.endsAt)))
    setIsRescheduling(true)
  }

  async function handleReschedule() {
    setIsSaving(true)
    try {
      await rescheduleReservation(courtId, reservation.id, {
        startsAt: new Date(newStartsAt).toISOString(),
        endsAt: new Date(newEndsAt).toISOString(),
      })
      setIsRescheduling(false)
      showToast('Reserva reagendada.', 'success')
      onChanged()
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
        return
      }
      showToast(err instanceof Error ? err.message : 'Não foi possível reagendar a reserva', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function run(action: () => Promise<unknown>, successMessage: string) {
    setIsSaving(true)
    try {
      await action()
      showToast(successMessage, 'success')
      onChanged()
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
        return
      }
      showToast(err instanceof Error ? err.message : 'Não foi possível concluir a ação', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const startsAt = new Date(reservation.startsAt)
  const endsAt = new Date(reservation.endsAt)
  const canCancel = reservation.status === 'CONFIRMED'
  const hoursUntilStart = (startsAt.getTime() - Date.now()) / 3_600_000

  return (
    <div className="reservation-modal__overlay" onClick={onClose}>
      <div className="reservation-modal" onClick={(event) => event.stopPropagation()}>
        <button className="reservation-modal__close" onClick={onClose} aria-label="Fechar">
          ×
        </button>

        <h2>{reservation.guestName}</h2>
        <p className="reservation-modal__slot">
          {startsAt.toLocaleDateString('pt-BR')} · {startsAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          {' – '}
          {endsAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </p>

        <div className="reservation-modal__form">
          <p className="reservation-modal__price">Telefone: {reservation.guestPhone}</p>
          <p className="reservation-modal__price">
            Valor: R$ {Number(reservation.priceSnapshot).toFixed(2).replace('.', ',')}
          </p>
          <p className="reservation-modal__price">Status: {STATUS_LABELS[reservation.status]}</p>
          {reservation.instructor && (
            <p className="reservation-modal__price">Instrutor: {reservation.instructor.name}</p>
          )}

          {reservation.status === 'CONFIRMED' && (
            <>
              <a
                className="reservation-modal__calendar-link"
                href={buildGoogleCalendarUrl({
                  title: reservation.guestName ? `${courtName} — ${reservation.guestName}` : courtName,
                  details: reservation.guestPhone
                    ? `Reserva no Jogaê Sports. Telefone: ${reservation.guestPhone}`
                    : 'Reserva no Jogaê Sports.',
                  startsAt: reservation.startsAt,
                  endsAt: reservation.endsAt,
                })}
                target="_blank"
                rel="noreferrer"
              >
                Adicionar ao Google Calendar
              </a>
              <button
                type="button"
                className="reservation-modal__submit"
                disabled={isSaving}
                onClick={() =>
                  run(() => updateReservationStatus(courtId, reservation.id, 'COMPLETED'), 'Reserva marcada como concluída.')
                }
              >
                Marcar como concluída
              </button>
              <button
                type="button"
                className="reservation-modal__submit"
                disabled={isSaving}
                onClick={() =>
                  run(() => updateReservationStatus(courtId, reservation.id, 'NO_SHOW'), 'Reserva marcada como não compareceu.')
                }
              >
                Marcar não compareceu
              </button>

              {isRescheduling ? (
                <>
                  <label className="reservation-modal__field">
                    <span>Novo início</span>
                    <input
                      type="datetime-local"
                      value={newStartsAt}
                      onChange={(e) => setNewStartsAt(e.target.value)}
                    />
                  </label>
                  <label className="reservation-modal__field">
                    <span>Novo fim</span>
                    <input
                      type="datetime-local"
                      value={newEndsAt}
                      onChange={(e) => setNewEndsAt(e.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className="reservation-modal__submit"
                    disabled={isSaving}
                    onClick={handleReschedule}
                  >
                    {isSaving ? 'Salvando...' : 'Confirmar novo horário'}
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    disabled={isSaving}
                    onClick={() => setIsRescheduling(false)}
                  >
                    Cancelar reagendamento
                  </button>
                </>
              ) : (
                <button type="button" className="reservation-modal__submit" disabled={isSaving} onClick={startRescheduling}>
                  Reagendar
                </button>
              )}

              <button
                type="button"
                className="reservation-modal__submit"
                disabled={isSaving || !canCancel}
                onClick={() => run(() => cancelReservation(courtId, reservation.id), 'Reserva cancelada.')}
              >
                Cancelar reserva
              </button>
              {hoursUntilStart < 2 && (
                <p className="reservation-modal__slot">
                  Faltam menos de 2h pro horário — o cancelamento vai ser recusado pelo sistema.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
