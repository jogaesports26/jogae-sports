import { useEffect, useState } from 'react'
import {
  cancelPlayerReservation,
  fetchPlayerReservations,
  getPlayerUser,
  PlayerSessionExpiredError,
  reschedulePlayerReservation,
} from '../lib/player'
import type { PlayerReservation } from '../lib/player'
import ReviewModal from '../components/portal/ReviewModal'
import ReceiptModal from '../components/portal/ReceiptModal'
import { shareOrCopy } from '../lib/share'
import type { ShareResult } from '../lib/share'
import { buildGoogleCalendarUrl } from '../lib/calendar'
import './PlayerReservationsPage.css'

const STATUS_LABELS: Record<PlayerReservation['status'], string> = {
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Concluída',
  NO_SHOW: 'Não compareceu',
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function toDatetimeLocalValue(date: Date): string {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

export default function PlayerReservationsPage() {
  const player = getPlayerUser()
  const [reservations, setReservations] = useState<PlayerReservation[] | null>(null)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [reviewingReservation, setReviewingReservation] = useState<PlayerReservation | null>(null)
  const [receiptReservation, setReceiptReservation] = useState<PlayerReservation | null>(null)
  const [shareResultId, setShareResultId] = useState<{ id: string; result: ShareResult } | null>(null)
  const [reschedulingId, setReschedulingId] = useState<string | null>(null)
  const [newStartsAt, setNewStartsAt] = useState('')
  const [newEndsAt, setNewEndsAt] = useState('')
  const [rescheduleError, setRescheduleError] = useState('')

  function load() {
    fetchPlayerReservations()
      .then(setReservations)
      .catch((err) => {
        if (err instanceof PlayerSessionExpiredError) {
          window.location.reload()
          return
        }
        setError(err instanceof Error ? err.message : 'Erro ao carregar suas reservas')
      })
  }

  useEffect(() => {
    if (player) load()
  }, [player])

  async function handleCancel(id: string) {
    setActionError('')
    try {
      await cancelPlayerReservation(id)
      load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Não foi possível cancelar')
    }
  }

  function startRescheduling(reservation: PlayerReservation) {
    setReschedulingId(reservation.id)
    setNewStartsAt(toDatetimeLocalValue(new Date(reservation.startsAt)))
    setNewEndsAt(toDatetimeLocalValue(new Date(reservation.endsAt)))
    setRescheduleError('')
  }

  async function handleReschedule(id: string) {
    setRescheduleError('')
    try {
      await reschedulePlayerReservation(id, {
        startsAt: new Date(newStartsAt).toISOString(),
        endsAt: new Date(newEndsAt).toISOString(),
      })
      setReschedulingId(null)
      load()
    } catch (err) {
      setRescheduleError(err instanceof Error ? err.message : 'Não foi possível reagendar')
    }
  }

  async function handleShare(reservation: PlayerReservation) {
    const slug = reservation.court.owner.establishmentSlug
    const startTime = new Date(reservation.startsAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    const result = await shareOrCopy({
      title: reservation.court.name,
      text: `Bora jogar? Tenho uma reserva em ${reservation.court.name} pra ${startTime}.`,
      url: slug ? `${window.location.origin}/${slug}/${reservation.court.id}` : window.location.origin,
    })
    setShareResultId({ id: reservation.id, result })
  }

  if (!player) {
    return (
      <div className="player-reservations-page">
        <h1>Minhas reservas</h1>
        <p className="player-reservations-page__empty">
          Você ainda não tem uma sessão ativa aqui. Suas reservas aparecem automaticamente depois que
          você reserva pela primeira vez, direto pelo link do estabelecimento — peça esse link pro dono
          da arena.
        </p>
      </div>
    )
  }

  return (
    <div className="player-reservations-page">
      <h1>Minhas reservas</h1>

      {error && <p className="player-reservations-page__error">{error}</p>}
      {actionError && <p className="player-reservations-page__error">{actionError}</p>}

      {!error && reservations === null && <p className="player-reservations-page__loading">Carregando...</p>}

      {reservations !== null && reservations.length === 0 && (
        <div className="player-reservations-page__empty">
          <p>Você ainda não tem nenhuma reserva.</p>
        </div>
      )}

      {reservations !== null && reservations.length > 0 && (
        <div className="player-reservations-page__list">
          {reservations.map((reservation) => (
            <div key={reservation.id} className="player-reservation-card">
              <div>
                <strong>{reservation.court.name}</strong>
                {reservation.court.owner.establishmentName && (
                  <span className="player-reservation-card__establishment">
                    {' '}
                    · {reservation.court.owner.establishmentName}
                  </span>
                )}
                <p className="player-reservation-card__time">
                  {formatDateTime(reservation.startsAt)} – {new Date(reservation.endsAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="player-reservation-card__price">
                  R$ {Number(reservation.priceSnapshot).toFixed(2).replace('.', ',')}
                </p>
                {shareResultId?.id === reservation.id && shareResultId.result === 'copied' && (
                  <p className="player-reservation-card__share-feedback">Link copiado! Cole numa conversa.</p>
                )}
                {reschedulingId === reservation.id && (
                  <div className="player-reservation-card__reschedule-form">
                    <label>
                      <span>Novo início</span>
                      <input
                        type="datetime-local"
                        value={newStartsAt}
                        onChange={(e) => setNewStartsAt(e.target.value)}
                      />
                    </label>
                    <label>
                      <span>Novo fim</span>
                      <input
                        type="datetime-local"
                        value={newEndsAt}
                        onChange={(e) => setNewEndsAt(e.target.value)}
                      />
                    </label>
                    {rescheduleError && (
                      <p className="player-reservations-page__error">{rescheduleError}</p>
                    )}
                    <div className="player-reservation-card__reschedule-actions">
                      <button
                        type="button"
                        className="player-reservation-card__reschedule-cancel"
                        onClick={() => setReschedulingId(null)}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="player-reservation-card__reschedule-confirm"
                        onClick={() => handleReschedule(reservation.id)}
                      >
                        Confirmar novo horário
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="player-reservation-card__actions">
                <span
                  className={`player-reservation-card__status player-reservation-card__status--${reservation.status.toLowerCase()}`}
                >
                  {STATUS_LABELS[reservation.status]}
                </span>
                {reservation.status === 'CONFIRMED' && (
                  <>
                    <button
                      className="player-reservation-card__share-button"
                      onClick={() => handleShare(reservation)}
                    >
                      Convidar pra jogar
                    </button>
                    <a
                      className="player-reservation-card__share-button"
                      href={buildGoogleCalendarUrl({
                        title: reservation.court.name,
                        details: `Reserva no Jogaê Sports — ${reservation.court.name}`,
                        startsAt: reservation.startsAt,
                        endsAt: reservation.endsAt,
                      })}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Google Calendar
                    </a>
                    <button
                      className="player-reservation-card__share-button"
                      onClick={() => setReceiptReservation(reservation)}
                    >
                      Comprovante
                    </button>
                    <button
                      className="player-reservation-card__share-button"
                      onClick={() => startRescheduling(reservation)}
                    >
                      Reagendar
                    </button>
                    <button onClick={() => handleCancel(reservation.id)}>Cancelar</button>
                  </>
                )}
                {reservation.status === 'COMPLETED' && (
                  <button
                    className="player-reservation-card__share-button"
                    onClick={() => setReceiptReservation(reservation)}
                  >
                    Comprovante
                  </button>
                )}
                {reservation.status === 'COMPLETED' && !reservation.review && (
                  <button
                    className="player-reservation-card__review-button"
                    onClick={() => setReviewingReservation(reservation)}
                  >
                    Avaliar
                  </button>
                )}
                {reservation.review && (
                  <span className="player-reservation-card__reviewed">
                    {'★'.repeat(reservation.review.rating)}
                    {'☆'.repeat(5 - reservation.review.rating)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {reviewingReservation && (
        <ReviewModal
          reservationId={reviewingReservation.id}
          courtName={reviewingReservation.court.name}
          onClose={() => setReviewingReservation(null)}
          onSubmitted={() => {
            setReviewingReservation(null)
            load()
          }}
        />
      )}

      {receiptReservation && (
        <ReceiptModal
          courtName={receiptReservation.court.name}
          establishmentName={receiptReservation.court.owner.establishmentName}
          dateLabel={`${formatDateTime(receiptReservation.startsAt)} – ${new Date(receiptReservation.endsAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
          price={Number(receiptReservation.priceSnapshot)}
          shareUrl={
            receiptReservation.court.owner.establishmentSlug
              ? `${window.location.origin}/${receiptReservation.court.owner.establishmentSlug}/${receiptReservation.court.id}`
              : window.location.origin
          }
          onClose={() => setReceiptReservation(null)}
        />
      )}
    </div>
  )
}
