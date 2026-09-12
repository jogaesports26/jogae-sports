import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePainelContext } from '../components/panel/PainelLayout'
import { SessionExpiredError } from '../lib/api'
import { fetchTodayReservations } from '../lib/reservations'
import type { TodayReservation } from '../lib/reservations'
import { fetchCourts } from '../lib/courts'
import type { Court } from '../lib/courts'
import { fetchProfile } from '../lib/profile'
import { fetchReports } from '../lib/reports'
import type { FinancialReport } from '../lib/reports'
import { toDateInputValue } from '../lib/weekGrid'
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

function formatCurrency(value: number) {
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

export default function OverviewPage() {
  const { user, onSessionExpired } = usePainelContext()
  const [reservations, setReservations] = useState<TodayReservation[] | null>(null)
  const [courts, setCourts] = useState<Court[] | null>(null)
  const [hasSlug, setHasSlug] = useState<boolean | null>(null)
  const [monthlyGoal, setMonthlyGoal] = useState<number | null>(null)
  const [monthReport, setMonthReport] = useState<FinancialReport | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const today = new Date()
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    Promise.all([
      fetchTodayReservations(),
      fetchCourts(),
      fetchProfile(),
      fetchReports({ from: toDateInputValue(monthStart), to: toDateInputValue(today) }),
    ])
      .then(([reservationsData, courtsData, profileData, reportData]) => {
        setReservations(reservationsData)
        setCourts(courtsData)
        setHasSlug(Boolean(profileData.establishmentSlug))
        setMonthlyGoal(profileData.monthlyRevenueGoal)
        setMonthReport(reportData)
      })
      .catch((err) => {
        if (err instanceof SessionExpiredError) {
          onSessionExpired()
          return
        }
        setError(err instanceof Error ? err.message : 'Erro ao carregar o painel')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalHoje = reservations?.length ?? 0
  const faturamentoHoje =
    reservations?.reduce((sum, r) => sum + Number(r.priceSnapshot), 0) ?? 0

  const steps = courts && hasSlug !== null
    ? [
        { label: 'Cadastre sua primeira quadra', done: courts.length > 0, to: '/painel/quadras' },
        {
          label: 'Defina os preços por horário',
          done: courts.some((court) => court.priceRules.length > 0),
          to: courts[0] ? `/painel/quadras/${courts[0].id}/precos` : '/painel/quadras',
        },
        { label: 'Configure o link da sua lojinha', done: hasSlug, to: '/painel/configuracoes' },
      ]
    : null
  const showChecklist = steps !== null && steps.some((step) => !step.done)

  const goalProgress =
    monthlyGoal && monthlyGoal > 0 && monthReport ? Math.min(monthReport.totalRevenue / monthlyGoal, 1) : null

  return (
    <div className="overview-page">
      <h1>Olá, {user.name.split(' ')[0]}!</h1>
      <p className="overview-page__subtitle">Aqui está o resumo do dia da sua arena.</p>

      {showChecklist && steps && (
        <div className="overview-page__checklist card">
          <h2>Primeiros passos</h2>
          <div className="overview-page__checklist-items">
            {steps.map((step) => (
              <Link
                key={step.label}
                to={step.to}
                className={`overview-page__checklist-item ${step.done ? 'overview-page__checklist-item--done' : ''}`}
              >
                <span className="overview-page__checklist-dot" aria-hidden="true">
                  {step.done ? '✓' : ''}
                </span>
                <span>{step.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

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
            <strong>{formatCurrency(faturamentoHoje)}</strong>
          </span>
        </div>
        <div className="overview-page__stat">
          <span className="overview-page__stat-icon" aria-hidden="true">
            📈
          </span>
          <span className="overview-page__stat-body">
            <span>Faturamento do mês</span>
            <strong>{monthReport ? formatCurrency(monthReport.totalRevenue) : '—'}</strong>
          </span>
        </div>
        <div className="overview-page__stat">
          <span className="overview-page__stat-icon" aria-hidden="true">
            🏟️
          </span>
          <span className="overview-page__stat-body">
            <span>Ocupação do mês</span>
            <strong>{monthReport ? `${Math.round(monthReport.occupancyRate * 100)}%` : '—'}</strong>
          </span>
        </div>
      </div>

      {goalProgress !== null && monthlyGoal && monthReport && (
        <Link to="/painel/relatorios" className="overview-page__goal card">
          <div className="overview-page__goal-header">
            <span className="kpi-label">Meta de faturamento do mês</span>
            <strong>
              {formatCurrency(monthReport.totalRevenue)} <span>de {formatCurrency(monthlyGoal)}</span>
            </strong>
          </div>
          <div className="overview-page__goal-bar">
            <div className="overview-page__goal-bar-fill" style={{ width: `${Math.round(goalProgress * 100)}%` }} />
          </div>
        </Link>
      )}

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
