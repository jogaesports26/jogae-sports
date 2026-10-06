import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePainelContext } from '../components/panel/PainelLayout'
import { IconCalendar, IconCourtOccupancy, IconGift, IconSleep, IconWallet } from '../components/panel/KpiIcons'
import { SessionExpiredError } from '../lib/api'
import { fetchTodayReservations } from '../lib/reservations'
import type { TodayReservation } from '../lib/reservations'
import { fetchCourts } from '../lib/courts'
import type { Court } from '../lib/courts'
import { fetchProfile } from '../lib/profile'
import { fetchReports } from '../lib/reports'
import type { FinancialReport } from '../lib/reports'
import { fetchCustomers, INACTIVE_THRESHOLD_DAYS, isBirthdayThisMonth } from '../lib/customers'
import type { Customer } from '../lib/customers'
import { toDateInputValue } from '../lib/weekGrid'
import { formatCurrency } from '../lib/money'
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
  const [courts, setCourts] = useState<Court[] | null>(null)
  const [hasSlug, setHasSlug] = useState<boolean | null>(null)
  const [monthlyGoal, setMonthlyGoal] = useState<number | null>(null)
  const [monthReport, setMonthReport] = useState<FinancialReport | null>(null)
  const [previousReport, setPreviousReport] = useState<FinancialReport | null>(null)
  const [customers, setCustomers] = useState<Customer[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const today = new Date()
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    // Mesmo período (dia 1 até o dia de hoje) do mês passado, pra comparar de forma justa no meio do mês.
    const previousStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const daysInPreviousMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate()
    const previousEnd = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      Math.min(today.getDate(), daysInPreviousMonth),
    )

    // allSettled em vez de all: dono e funcionário compartilham essa tela, mas
    // perfil/relatórios são só do dono — uma rejeição ali não pode derrubar as
    // reservas de hoje e as quadras, que o funcionário também vê.
    Promise.allSettled([
      fetchTodayReservations(),
      fetchCourts(),
      fetchProfile(),
      fetchReports({ from: toDateInputValue(monthStart), to: toDateInputValue(today) }),
      fetchCustomers(),
      fetchReports({ from: toDateInputValue(previousStart), to: toDateInputValue(previousEnd) }),
    ]).then(([reservationsResult, courtsResult, profileResult, reportResult, customersResult, previousResult]) => {
      if (
        [reservationsResult, courtsResult, profileResult, reportResult, customersResult, previousResult].some(
          (result) => result.status === 'rejected' && result.reason instanceof SessionExpiredError,
        )
      ) {
        onSessionExpired()
        return
      }

      if (reservationsResult.status === 'fulfilled') {
        setReservations(reservationsResult.value)
      } else {
        setError(reservationsResult.reason instanceof Error ? reservationsResult.reason.message : 'Erro ao carregar o painel')
      }

      if (courtsResult.status === 'fulfilled') {
        setCourts(courtsResult.value)
      }

      if (profileResult.status === 'fulfilled') {
        setHasSlug(Boolean(profileResult.value.establishmentSlug))
        setMonthlyGoal(profileResult.value.monthlyRevenueGoal)
      }

      if (reportResult.status === 'fulfilled') {
        setMonthReport(reportResult.value)
      }

      if (customersResult.status === 'fulfilled') {
        setCustomers(customersResult.value)
      }

      if (previousResult.status === 'fulfilled') {
        setPreviousReport(previousResult.value)
      }
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

  const revenueTrend =
    monthReport && previousReport && previousReport.totalRevenue > 0
      ? (monthReport.totalRevenue - previousReport.totalRevenue) / previousReport.totalRevenue
      : null

  const singleCourt = courts?.length === 1 ? courts[0] : null
  const agendaLink = singleCourt ? `/painel/quadras/${singleCourt.id}/agenda` : '/painel/quadras'

  const goalProgress =
    monthlyGoal && monthlyGoal > 0 && monthReport ? Math.min(monthReport.totalRevenue / monthlyGoal, 1) : null

  const currentMonth = new Date().getMonth()
  const birthdaysCount = customers?.filter((c) => isBirthdayThisMonth(c.birthDate, currentMonth)).length ?? 0
  const inactiveCount = customers?.filter((c) => c.daysSinceLastReservation >= INACTIVE_THRESHOLD_DAYS).length ?? 0

  return (
    <div className="overview-page">
      <div className="overview-page__header">
        <div>
          <h1>Olá, {user.name.split(' ')[0]}!</h1>
          <p className="overview-page__subtitle">Aqui está o resumo da sua arena.</p>
        </div>
        <div className="overview-page__shortcuts">
          <Link to={agendaLink} className="btn btn--primary btn--sm">
            {singleCourt ? 'Abrir agenda' : 'Ver quadras e agendas'}
          </Link>
          {user.role !== 'STAFF' && (
            <Link to="/painel/relatorios" className="btn btn--outline btn--sm">
              Relatórios
            </Link>
          )}
        </div>
      </div>

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

      {monthReport && (
        <section className="overview-page__hero card">
          <div className="overview-page__hero-main">
            <span className="kpi-label">Faturamento do mês</span>
            <div className="overview-page__hero-value">
              <strong>{formatCurrency(monthReport.totalRevenue)}</strong>
              {revenueTrend !== null && (
                <span className={`pill ${revenueTrend >= 0 ? 'pill--positive' : 'pill--negative'}`}>
                  {revenueTrend >= 0 ? '▲' : '▼'} {Math.abs(Math.round(revenueTrend * 100))}%
                </span>
              )}
            </div>
            <small className="overview-page__hero-note">
              {revenueTrend !== null
                ? 'em relação ao mesmo período do mês passado'
                : 'sem faturamento no mesmo período do mês passado pra comparar'}
            </small>

            {goalProgress !== null && monthlyGoal && (
              <Link to="/painel/configuracoes?aba=metas" className="overview-page__goal">
                <div className="overview-page__goal-header">
                  <span>Meta do mês</span>
                  <span>
                    {Math.round(goalProgress * 100)}% de {formatCurrency(monthlyGoal)}
                  </span>
                </div>
                <div className="overview-page__goal-bar">
                  <div className="overview-page__goal-bar-fill" style={{ width: `${Math.round(goalProgress * 100)}%` }} />
                </div>
              </Link>
            )}
          </div>

          <div className="overview-page__hero-side">
            <span className="overview-page__stat-icon">
              <IconCourtOccupancy />
            </span>
            <span className="kpi-label">Ocupação do mês</span>
            <strong>{Math.round(monthReport.occupancyRate * 100)}%</strong>
          </div>
        </section>
      )}

      <div className="overview-page__columns">
        <div className="overview-page__today">
          <div className="overview-page__stats">
            <div className="overview-page__stat">
              <span className="overview-page__stat-icon">
                <IconCalendar />
              </span>
              <span className="overview-page__stat-body">
                <span>Reservas hoje</span>
                <strong>{totalHoje}</strong>
              </span>
            </div>
            <div className="overview-page__stat">
              <span className="overview-page__stat-icon">
                <IconWallet />
              </span>
              <span className="overview-page__stat-body">
                <span>Previsto pra hoje</span>
                <strong>{formatCurrency(faturamentoHoje)}</strong>
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

        {(birthdaysCount > 0 || inactiveCount > 0) && (
          <aside className="overview-page__attention card">
            <h2>Pra ficar de olho</h2>
            {birthdaysCount > 0 && (
              <Link to="/painel/clientes?filtro=birthdays" className="overview-page__attention-item">
                <span className="overview-page__alert-icon overview-page__alert-icon--warning">
                  <IconGift />
                </span>
                <span>
                  <strong>{birthdaysCount}</strong>{' '}
                  {birthdaysCount === 1 ? 'aniversariante esse mês' : 'aniversariantes esse mês'}
                </span>
              </Link>
            )}
            {inactiveCount > 0 && (
              <Link to="/painel/clientes?filtro=inactive" className="overview-page__attention-item">
                <span className="overview-page__alert-icon overview-page__alert-icon--neutral">
                  <IconSleep />
                </span>
                <span>
                  <strong>{inactiveCount}</strong> {inactiveCount === 1 ? 'cliente inativo' : 'clientes inativos'}
                </span>
              </Link>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}
