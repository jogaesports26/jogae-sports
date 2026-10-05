import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
import CancelReservationModal from '../components/portal/CancelReservationModal'
import PlayerLoginForm from '../components/portal/PlayerLoginForm'
import { shareOrCopy } from '../lib/share'
import type { ShareResult } from '../lib/share'
import { buildGoogleCalendarUrl } from '../lib/calendar'
import { showToast } from '../lib/toast'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import './PlayerReservationsPage.css'

const STATUS_LABELS: Record<PlayerReservation['status'], string> = {
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Concluída',
  NO_SHOW: 'Não compareceu',
}

const STATUS_PILLS: Record<PlayerReservation['status'], string> = {
  CONFIRMED: 'pill--positive',
  CANCELLED: 'pill--neutral',
  COMPLETED: 'pill--info',
  NO_SHOW: 'pill--negative',
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function formatReservationRange(reservation: PlayerReservation) {
  const endTime = new Date(reservation.endsAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${formatDateTime(reservation.startsAt)} – ${endTime}`
}

function toDatetimeLocalValue(date: Date): string {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

export default function PlayerReservationsPage() {
  useDocumentTitle('Minhas reservas · Jogaê Sports')
  const player = getPlayerUser()
  const lastSlug = (() => {
    try {
      return localStorage.getItem('jogae_last_slug')
    } catch {
      return null
    }
  })()
  const [reservations, setReservations] = useState<PlayerReservation[] | null>(null)
  const [error, setError] = useState('')
  const [reviewingReservation, setReviewingReservation] = useState<PlayerReservation | null>(null)
  const [receiptReservation, setReceiptReservation] = useState<PlayerReservation | null>(null)
  const [cancellingReservation, setCancellingReservation] = useState<PlayerReservation | null>(null)
  const [shareResultId, setShareResultId] = useState<{ id: string; result: ShareResult } | null>(null)
  const [reschedulingId, setReschedulingId] = useState<string | null>(null)
  const [newStartsAt, setNewStartsAt] = useState('')
  const [newEndsAt, setNewEndsAt] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

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

  useEffect(() => {
    if (!openMenuId) return
    function close(event: Event) {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return
      if (event instanceof MouseEvent && (event.target as HTMLElement).closest('.player-reservation-card__menu-wrap')) return
      setOpenMenuId(null)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [openMenuId])

  async function handleCancel(id: string) {
    try {
      await cancelPlayerReservation(id)
      setCancellingReservation(null)
      showToast('Reserva cancelada.', 'success')
      load()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Não foi possível cancelar', 'error')
    }
  }

  function startRescheduling(reservation: PlayerReservation) {
    setReschedulingId(reservation.id)
    setNewStartsAt(toDatetimeLocalValue(new Date(reservation.startsAt)))
    setNewEndsAt(toDatetimeLocalValue(new Date(reservation.endsAt)))
  }

  async function handleReschedule(id: string) {
    try {
      await reschedulePlayerReservation(id, {
        startsAt: new Date(newStartsAt).toISOString(),
        endsAt: new Date(newEndsAt).toISOString(),
      })
      setReschedulingId(null)
      showToast('Reserva reagendada.', 'success')
      load()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Não foi possível reagendar', 'error')
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
        <div className="player-reservations-page__login">
          <PlayerLoginForm
            hint="Entre com seu nome e telefone pra ver suas reservas."
            onSuccess={() => window.location.reload()}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="player-reservations-page">
      <h1>Minhas reservas</h1>

      {error && <p className="player-reservations-page__error">{error}</p>}

      {!error && reservations === null && (
        <div className="list-stack player-reservations-page__list" aria-busy="true" aria-label="Carregando suas reservas">
          <div className="skeleton player-reservations-page__skeleton" />
          <div className="skeleton player-reservations-page__skeleton" />
        </div>
      )}

      {reservations !== null && reservations.length === 0 && (
        <div className="player-reservations-page__empty">
          <p>Você ainda não tem nenhuma reserva.</p>
          {lastSlug && (
            <Link to={`/${lastSlug}`} className="btn btn--primary btn--sm">
              Ver quadras e reservar
            </Link>
          )}
        </div>
      )}

      {reservations !== null && reservations.length > 0 && (
        <div className="list-stack player-reservations-page__list">
          {reservations.map((reservation) => (
            <div key={reservation.id} className="list-card player-reservation-card">
              <div className="list-card__header">
                <div className="player-reservation-card__title">
                  <strong className="list-card__title">{reservation.court.name}</strong>
                  {reservation.court.owner.establishmentName && (
                    <span className="list-card__meta">{reservation.court.owner.establishmentName}</span>
                  )}
                </div>
                <span className={`pill ${STATUS_PILLS[reservation.status]}`}>{STATUS_LABELS[reservation.status]}</span>
              </div>

              <div className="player-reservation-card__when">
                <span className="player-reservation-card__time">{formatReservationRange(reservation)}</span>
                <span className="player-reservation-card__price">
                  R$ {Number(reservation.priceSnapshot).toFixed(2).replace('.', ',')}
                </span>
              </div>

              {shareResultId?.id === reservation.id && shareResultId.result === 'copied' && (
                <p className="player-reservation-card__share-feedback">Link copiado! Cole numa conversa.</p>
              )}

              {reschedulingId === reservation.id && (
                <div className="player-reservation-card__reschedule-form">
                  <label className="field field--sm">
                    <span>Novo início</span>
                    <input
                      className="input input--sm"
                      type="datetime-local"
                      value={newStartsAt}
                      onChange={(e) => setNewStartsAt(e.target.value)}
                    />
                  </label>
                  <label className="field field--sm">
                    <span>Novo fim</span>
                    <input
                      className="input input--sm"
                      type="datetime-local"
                      value={newEndsAt}
                      onChange={(e) => setNewEndsAt(e.target.value)}
                    />
                  </label>
                  <div className="player-reservation-card__reschedule-actions">
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => setReschedulingId(null)}>
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={() => handleReschedule(reservation.id)}
                    >
                      Confirmar novo horário
                    </button>
                  </div>
                </div>
              )}

              {reservation.status === 'CONFIRMED' && (
                <div className="player-reservation-card__actions">
                  <button type="button" className="btn btn--primary" onClick={() => handleShare(reservation)}>
                    Convidar pra jogar
                  </button>
                  <button type="button" className="btn btn--outline" onClick={() => setReceiptReservation(reservation)}>
                    Comprovante
                  </button>
                  <div className="player-reservation-card__menu-wrap">
                    <button
                      type="button"
                      className="btn btn--outline player-reservation-card__menu-button"
                      aria-haspopup="menu"
                      aria-expanded={openMenuId === reservation.id}
                      aria-label="Mais ações da reserva"
                      onClick={() => setOpenMenuId((current) => (current === reservation.id ? null : reservation.id))}
                    >
                      ⋮
                    </button>
                    {openMenuId === reservation.id && (
                      <div className="player-reservation-card__menu" role="menu">
                        <a
                          role="menuitem"
                          href={buildGoogleCalendarUrl({
                            title: reservation.court.name,
                            details: `Reserva no Jogaê Sports — ${reservation.court.name}`,
                            startsAt: reservation.startsAt,
                            endsAt: reservation.endsAt,
                          })}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => setOpenMenuId(null)}
                        >
                          Adicionar ao Google Calendar
                        </a>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setOpenMenuId(null)
                            startRescheduling(reservation)
                          }}
                        >
                          Reagendar
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="player-reservation-card__menu-danger"
                          onClick={() => {
                            setOpenMenuId(null)
                            setCancellingReservation(reservation)
                          }}
                        >
                          Cancelar reserva
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {reservation.status === 'COMPLETED' && (
                <div className="player-reservation-card__actions">
                  {!reservation.review && (
                    <button type="button" className="btn btn--primary" onClick={() => setReviewingReservation(reservation)}>
                      Avaliar
                    </button>
                  )}
                  <button type="button" className="btn btn--outline" onClick={() => setReceiptReservation(reservation)}>
                    Comprovante
                  </button>
                  {reservation.review && (
                    <span className="player-reservation-card__reviewed">
                      {'★'.repeat(reservation.review.rating)}
                      {'☆'.repeat(5 - reservation.review.rating)}
                    </span>
                  )}
                </div>
              )}
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
          dateLabel={formatReservationRange(receiptReservation)}
          price={Number(receiptReservation.priceSnapshot)}
          shareUrl={
            receiptReservation.court.owner.establishmentSlug
              ? `${window.location.origin}/${receiptReservation.court.owner.establishmentSlug}/${receiptReservation.court.id}`
              : window.location.origin
          }
          onClose={() => setReceiptReservation(null)}
        />
      )}

      {cancellingReservation && (
        <CancelReservationModal
          courtName={cancellingReservation.court.name}
          establishmentName={cancellingReservation.court.owner.establishmentName}
          dateLabel={formatReservationRange(cancellingReservation)}
          price={Number(cancellingReservation.priceSnapshot)}
          onConfirm={() => handleCancel(cancellingReservation.id)}
          onClose={() => setCancellingReservation(null)}
        />
      )}
    </div>
  )
}
