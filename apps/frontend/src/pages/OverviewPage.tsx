import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePainelContext } from '../components/panel/PainelLayout'
import { SessionExpiredError } from '../lib/api'
import { fetchTodayReservations } from '../lib/reservations'
import type { TodayReservation } from '../lib/reservations'
import './OverviewPage.css'

const STATUS_LABELS: Record<TodayReservation['status'], string> = {
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Concluída',
  NO_SHOW: 'Não compareceu',
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export default function OverviewPage() {
  const { user, onSessionExpired } = usePainelContext()
  const [reservations, setReservations] = useState<TodayReservation[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTodayReservations()
      .then(setReservations)
      .catch((err) => {
        if (err instanceof SessionExpiredError) {
          onSessionExpired()
          return
        }
        setError(err instanceof Error ? err.message : 'Erro ao carregar as reservas de hoje')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalHoje = reservations?.length ?? 0
  const faturamentoHoje =
    reservations?.reduce((sum, r) => sum + Number(r.priceSnapshot), 0) ?? 0

  return (
    <div className="overview-page">
      <h1>Olá, {user.name.split(' ')[0]}!</h1>
      <p className="overview-page__subtitle">Aqui está o resumo do dia da sua arena.</p>

      <div className="overview-page__stats">
        <div className="overview-page__stat">
          <span className="overview-page__stat-icon" aria-hidden="true">
            📅
          </span>
          <span className="overview-page__stat-body">
            <span>Reservas hoje</span>
            <strong>{totalHoje}</strong>
          </span>
        </div>
        <div className="overview-page__stat">
          <span className="overview-page__stat-icon" aria-hidden="true">
            💰
          </span>
          <span className="overview-page__stat-body">
            <span>Previsto pra hoje</span>
            <strong>R$ {faturamentoHoje.toFixed(2).replace('.', ',')}</strong>
          </span>
        </div>
      </div>

      <div className="overview-page__section">
        <h2>Reservas de hoje</h2>

        {error && <p className="overview-page__error">{error}</p>}

        {!error && reservations === null && <p className="overview-page__loading">Carregando...</p>}

        {reservations !== null && reservations.length === 0 && (
          <div className="overview-page__empty">
            <p>Nenhuma reserva pra hoje ainda.</p>
            <Link to="/painel/quadras" className="overview-page__cta">
              Ver suas quadras
            </Link>
          </div>
        )}

        {reservations !== null && reservations.length > 0 && (
          <div className="overview-page__list">
            {reservations.map((reservation) => (
              <Link
                key={reservation.id}
                to={`/painel/quadras/${reservation.court.id}/agenda`}
                className="overview-page__item"
              >
                <span className="overview-page__item-time">
                  {formatTime(reservation.startsAt)}–{formatTime(reservation.endsAt)}
                </span>
                <span className="overview-page__item-info">
                  <strong>{reservation.guestName}</strong>
                  <small>{reservation.court.name}</small>
                </span>
                <span className={`overview-page__item-status overview-page__item-status--${reservation.status.toLowerCase()}`}>
                  {STATUS_LABELS[reservation.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
