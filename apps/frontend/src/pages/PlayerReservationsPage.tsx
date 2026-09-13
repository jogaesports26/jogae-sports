import { useEffect, useState } from 'react'
import {
  cancelPlayerReservation,
  fetchPlayerReservations,
  getPlayerUser,
  PlayerSessionExpiredError,
} from '../lib/player'
import type { PlayerReservation } from '../lib/player'
import ReviewModal from '../components/portal/ReviewModal'
import { shareOrCopy } from '../lib/share'
import type { ShareResult } from '../lib/share'
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

export default function PlayerReservationsPage() {
  const player = getPlayerUser()
  const [reservations, setReservations] = useState<PlayerReservation[] | null>(null)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [reviewingReservation, setReviewingReservation] = useState<PlayerReservation | null>(null)
  const [shareResultId, setShareResultId] = useState<{ id: string; result: ShareResult } | null>(null)

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
                    <button onClick={() => handleCancel(reservation.id)}>Cancelar</button>
                  </>
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
    </div>
  )
}
