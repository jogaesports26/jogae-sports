import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePainelContext } from '../components/panel/PainelLayout'
import { IconGift, IconSleep } from '../components/panel/KpiIcons'
import DayGridCard from '../components/panel/DayGridCard'
import PageHeader from '../components/panel/PageHeader'
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

const STATUS: Record<TodayReservation['status'], { label: string; pill: string }> = {
  CONFIRMED: { label: 'Confirmada', pill: 'pill--positive' },
  CANCELLED: { label: 'Cancelada', pill: 'pill--negative' },
  COMPLETED: { label: 'Concluída', pill: 'pill--info' },
  NO_SHOW: { label: 'Não compareceu', pill: 'pill--warning' },
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

  const nowTime = Date.now()
  const upcoming = (reservations ?? []).filter(
    (reservation) => reservation.status === 'CONFIRMED' && new Date(reservation.endsAt).getTime() > nowTime,
  )
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

  const goalProgress =
    monthlyGoal && monthlyGoal > 0 && monthReport ? Math.min(monthReport.totalRevenue / monthlyGoal, 1) : null

  const currentMonth = new Date().getMonth()
  const birthdaysCount = customers?.filter((c) => isBirthdayThisMonth(c.birthDate, currentMonth)).length ?? 0
  const inactiveCount = customers?.filter((c) => c.daysSinceLastReservation >= INACTIVE_THRESHOLD_DAYS).length ?? 0

  return (
    <div className="overview-page">
      <PageHeader
        title="Hoje"
        subtitle={`Olá, ${user.name.split(' ')[0]}. Aqui está a sua arena agora.`}
        actions={
          user.role !== 'STAFF' && (
            <Link to="/painel/relatorios" className="btn btn--outline btn--sm">
              Ver financeiro
            </Link>
          )
        }
      />

      {showChecklist && steps && (
        <section className="overview-page__checklist panel-card">
          <div className="panel-card__head">
            <h2>Primeiros passos</h2>
          </div>
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
        </section>
      )}

      <section className="kpi-strip panel-card" aria-label="Indicadores">
        {monthReport && (
          <>
            <div className="kpi">
              <span className="kpi__label">Faturamento do mês</span>
              <strong className="kpi__value">{formatCurrency(monthReport.totalRevenue)}</strong>
              <span className="kpi__note">
                {revenueTrend !== null ? (
                  <>
                    <span className={`pill ${revenueTrend >= 0 ? 'pill--positive' : 'pill--negative'}`}>
                      {revenueTrend >= 0 ? '▲' : '▼'} {Math.abs(Math.round(revenueTrend * 100))}%
                    </span>{' '}
                    sobre o mesmo período do mês passado
                  </>
                ) : (
                  'sem faturamento no mesmo período do mês passado pra comparar'
                )}
              </span>
            </div>
            <div className="kpi">
              <span className="kpi__label">Ocupação do mês</span>
              <strong className="kpi__value">{Math.round(monthReport.occupancyRate * 100)}%</strong>
              <span className="kpi__note">dos horários com preço definido</span>
            </div>
          </>
        )}
        <div className="kpi">
          <span className="kpi__label">Reservas hoje</span>
          <strong className="kpi__value">{totalHoje}</strong>
          <span className="kpi__note">{totalHoje === 1 ? 'reserva marcada' : 'reservas marcadas'}</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Previsto pra hoje</span>
          <strong className="kpi__value">{formatCurrency(faturamentoHoje)}</strong>
          <span className="kpi__note">se todas as reservas se confirmarem</span>
        </div>

        {goalProgress !== null && monthlyGoal && (
          <Link to="/painel/configuracoes?aba=metas" className="kpi-strip__goal">
            <span>Meta do mês</span>
            <span className="kpi-strip__goal-bar" role="progressbar" aria-valuenow={Math.round(goalProgress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso da meta do mês">
              <span style={{ width: `${Math.round(goalProgress * 100)}%` }} />
            </span>
            <span>
              {Math.round(goalProgress * 100)}% de {formatCurrency(monthlyGoal)}
            </span>
          </Link>
        )}
      </section>

      <DayGridCard />

      <div className="overview-page__columns">
        <section className="panel-card">
          <div className="panel-card__head">
            <h2>Próximas reservas de hoje</h2>
          </div>

          {error && <p className="overview-page__error">{error}</p>}
          {!error && reservations === null && <p className="overview-page__loading">Carregando...</p>}

          {reservations !== null && upcoming.length === 0 && (
            <div className="empty-state">
              <p>{reservations.length === 0 ? 'Nenhuma reserva pra hoje ainda.' : 'Não há mais reservas a caminho hoje.'}</p>
              <Link to="/painel/quadras">Ver suas quadras</Link>
            </div>
          )}

          {reservations !== null && upcoming.length > 0 && (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Horário</th>
                    <th scope="col">Cliente</th>
                    <th scope="col" className="col-hide-sm">
                      Quadra
                    </th>
                    <th scope="col">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((reservation) => (
                    <tr key={reservation.id}>
                      <td className="time">
                        {formatTime(reservation.startsAt)}–{formatTime(reservation.endsAt)}
                      </td>
                      <td>
                        <Link to={`/painel/quadras/${reservation.court.id}/agenda`}>{reservation.guestName}</Link>
                        <small className="data-table__sub">{reservation.court.name}</small>
                      </td>
                      <td className="col-hide-sm">{reservation.court.name}</td>
                      <td>
                        <span className={`pill ${STATUS[reservation.status].pill}`}>{STATUS[reservation.status].label}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {(birthdaysCount > 0 || inactiveCount > 0) && (
          <aside className="panel-card">
            <div className="panel-card__head">
              <h2>Pra ficar de olho</h2>
            </div>
            <div className="overview-page__attention">
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
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
