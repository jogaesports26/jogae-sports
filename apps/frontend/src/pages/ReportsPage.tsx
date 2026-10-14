import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePainelContext } from '../components/panel/PainelLayout'
import { IconCalendar, IconCourtOccupancy, IconWallet } from '../components/panel/KpiIcons'
import { SessionExpiredError } from '../lib/api'
import { fetchCourts } from '../lib/courts'
import type { Court } from '../lib/courts'
import { fetchProfile } from '../lib/profile'
import { downloadReportsCsv, fetchCommercialReport, fetchReports } from '../lib/reports'
import type { CommercialReport, FinancialReport } from '../lib/reports'
import AreaChart from '../components/panel/charts/AreaChart'
import GroupedBarChart from '../components/panel/charts/GroupedBarChart'
import RankBars from '../components/panel/charts/RankBars'
import { fillDailySeries, percentChange, previousRange } from '../lib/chartMath'
import { toDateInputValue } from '../lib/weekGrid'
import { formatCurrency } from '../lib/money'
import './ReportsPage.css'

type QuickRange = 'today' | '7d' | 'thisMonth' | 'lastMonth' | 'custom'

const RANGE_LABELS: Record<QuickRange, string> = {
  today: 'Hoje',
  '7d': 'Últimos 7 dias',
  thisMonth: 'Este mês',
  lastMonth: 'Mês passado',
  custom: 'Personalizado',
}

function currentMonthRange(today: Date) {
  const from = new Date(today.getFullYear(), today.getMonth(), 1)
  return { from, to: today }
}

function rangeFor(range: QuickRange, today: Date): { from: Date; to: Date } {
  switch (range) {
    case 'today':
      return { from: today, to: today }
    case '7d': {
      const from = new Date(today)
      from.setDate(from.getDate() - 6)
      return { from, to: today }
    }
    case 'thisMonth':
      return currentMonthRange(today)
    case 'lastMonth': {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const to = new Date(today.getFullYear(), today.getMonth(), 0)
      return { from, to }
    }
    default:
      return currentMonthRange(today)
  }
}

function formatDayLabel(dateStr: string) {
  const [, month, day] = dateStr.split('-')
  return `${day}/${month}`
}

function Delta({ current, previous }: { current: number; previous: number | undefined }) {
  const change = previous === undefined ? null : percentChange(current, previous)
  if (change === null) return <small className="reports-page__delta reports-page__delta--none">sem período anterior para comparar</small>
  const up = change >= 0
  return (
    <small className={`reports-page__delta ${up ? 'reports-page__delta--up' : 'reports-page__delta--down'}`}>
      <i aria-hidden="true">{up ? '▲' : '▼'}</i> {up ? '+' : ''}
      {change}% <em className="reports-page__delta-note">sobre o período anterior</em>
    </small>
  )
}

export default function ReportsPage() {
  const { onSessionExpired } = usePainelContext()
  const today = useMemo(() => new Date(), [])

  const [range, setRange] = useState<QuickRange>('thisMonth')
  const [from, setFrom] = useState(() => toDateInputValue(rangeFor('thisMonth', today).from))
  const [to, setTo] = useState(() => toDateInputValue(rangeFor('thisMonth', today).to))
  const [courtId, setCourtId] = useState('')

  const [courts, setCourts] = useState<Court[]>([])
  const [report, setReport] = useState<FinancialReport | null>(null)
  const [previousReport, setPreviousReport] = useState<FinancialReport | null>(null)
  const [commercialReport, setCommercialReport] = useState<CommercialReport | null>(null)
  const [monthlyGoal, setMonthlyGoal] = useState<number | null>(null)
  const [monthRevenue, setMonthRevenue] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)
  const latestRequestRef = useRef(0)

  function handleRangeChange(nextRange: QuickRange) {
    setRange(nextRange)
    const { from: nextFrom, to: nextTo } = rangeFor(nextRange, today)
    setFrom(toDateInputValue(nextFrom))
    setTo(toDateInputValue(nextTo))
  }

  useEffect(() => {
    fetchCourts()
      .then(setCourts)
      .catch(() => {
        // seletor de quadra é auxiliar — uma falha aqui não deve travar a página
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const monthRange = currentMonthRange(today)
    Promise.all([
      fetchProfile(),
      fetchReports({
        from: toDateInputValue(monthRange.from),
        to: toDateInputValue(monthRange.to),
      }),
    ])
      .then(([profile, monthReport]) => {
        setMonthlyGoal(profile.monthlyRevenueGoal)
        setMonthRevenue(monthReport.totalRevenue)
      })
      .catch((err) => {
        if (err instanceof SessionExpiredError) {
          onSessionExpired()
        }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const requestId = ++latestRequestRef.current
    setLoading(true)
    setError('')
    Promise.all([
      fetchReports({ from, to, courtId: courtId || undefined }),
      fetchCommercialReport({ from, to, courtId: courtId || undefined }),
      fetchReports({ ...previousRange(from, to), courtId: courtId || undefined }).catch(() => null),
    ])
      .then(([data, commercialData, previousData]) => {
        // Descarta a resposta se um filtro mais recente já disparou outra
        // busca — sem isso, uma resposta mais lenta podia chegar por último
        // e sobrescrever o estado com os dados de um período errado.
        if (requestId !== latestRequestRef.current) return
        setReport(data)
        setCommercialReport(commercialData)
        setPreviousReport(previousData)
      })
      .catch((err) => {
        if (requestId !== latestRequestRef.current) return
        if (err instanceof SessionExpiredError) {
          onSessionExpired()
          return
        }
        setError(err instanceof Error ? err.message : 'Erro ao carregar os relatórios')
      })
      .finally(() => {
        if (requestId !== latestRequestRef.current) return
        setLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, courtId])

  async function handleExport() {
    setExporting(true)
    try {
      await downloadReportsCsv({ from, to, courtId: courtId || undefined })
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
        return
      }
      setError(err instanceof Error ? err.message : 'Não foi possível exportar o relatório')
    } finally {
      setExporting(false)
    }
  }

  const goalProgress = monthlyGoal && monthlyGoal > 0 && monthRevenue !== null
    ? Math.min(monthRevenue / monthlyGoal, 1)
    : null

  const dailySeries = report ? fillDailySeries(report.from.slice(0, 10), report.to.slice(0, 10), report.dailyRevenue) : []
  const previousByCourt = new Map((previousReport?.courts ?? []).map((c) => [c.courtId, c]))
  const hasRevenue = (report?.totalRevenue ?? 0) > 0

  return (
    <div className="reports-page">
      <h1>Financeiro</h1>
      <p className="reports-page__subtitle">Acompanhe o faturamento, a ocupação e o desempenho das suas quadras.</p>

      <div className="reports-page__goal card">
        <div className="reports-page__goal-header">
          <span className="kpi-label">Meta de faturamento do mês</span>
          {monthlyGoal ? (
            <strong className="reports-page__goal-value">
              {formatCurrency(monthRevenue ?? 0)} <span>de {formatCurrency(monthlyGoal)}</span>
            </strong>
          ) : (
            <Link to="/painel/configuracoes?aba=metas" className="reports-page__goal-cta">
              Definir meta nas configurações
            </Link>
          )}
        </div>
        {goalProgress !== null && (
          <div className="reports-page__goal-bar">
            <div
              className="reports-page__goal-bar-fill"
              style={{ width: `${Math.round(goalProgress * 100)}%` }}
            />
          </div>
        )}
      </div>

      <div className="reports-page__filters">
        <div className="reports-page__ranges">
          {(Object.keys(RANGE_LABELS) as QuickRange[])
            .filter((key) => key !== 'custom')
            .map((key) => (
              <button
                key={key}
                type="button"
                className={`reports-page__range-btn ${range === key ? 'reports-page__range-btn--active' : ''}`}
                onClick={() => handleRangeChange(key)}
              >
                {RANGE_LABELS[key]}
              </button>
            ))}
        </div>

        <div className="reports-page__custom-dates">
          <label>
            <span>De</span>
            <input
              type="date"
              value={from}
              max={to}
              onChange={(event) => {
                setRange('custom')
                setFrom(event.target.value)
              }}
            />
          </label>
          <label>
            <span>Até</span>
            <input
              type="date"
              value={to}
              min={from}
              onChange={(event) => {
                setRange('custom')
                setTo(event.target.value)
              }}
            />
          </label>
        </div>

        <select
          className="reports-page__court-select"
          value={courtId}
          onChange={(event) => setCourtId(event.target.value)}
        >
          <option value="">Todas as quadras</option>
          {courts.map((court) => (
            <option key={court.id} value={court.id}>
              {court.name}
            </option>
          ))}
        </select>

        <button type="button" className="btn btn--outline btn--sm" onClick={handleExport} disabled={exporting || !report}>
          {exporting ? 'Exportando...' : 'Exportar CSV'}
        </button>
      </div>

      {error && <p className="reports-page__error">{error}</p>}

      {loading && !report && <p className="reports-page__loading">Carregando...</p>}

      {report && (
        <>
          <div className="reports-page__stats">
            <div className="reports-page__stat">
              <span className="reports-page__stat-icon">
                <IconWallet />
              </span>
              <span className="reports-page__stat-body">
                <span>Faturamento no período</span>
                <strong>{formatCurrency(report.totalRevenue)}</strong>
                <Delta current={report.totalRevenue} previous={previousReport?.totalRevenue} />
              </span>
            </div>
            <div className="reports-page__stat">
              <span className="reports-page__stat-icon">
                <IconCalendar />
              </span>
              <span className="reports-page__stat-body">
                <span>Reservas no período</span>
                <strong>{report.reservationsCount}</strong>
                <Delta current={report.reservationsCount} previous={previousReport?.reservationsCount} />
              </span>
            </div>
            <div className="reports-page__stat">
              <span className="reports-page__stat-icon">
                <IconCourtOccupancy />
              </span>
              <span className="reports-page__stat-body">
                <span>Taxa de ocupação</span>
                <strong>{Math.round(report.occupancyRate * 100)}%</strong>
                <Delta
                  current={report.occupancyRate}
                  previous={previousReport?.occupancyRate}
                />
              </span>
            </div>
          </div>

          <p className="reports-page__note">
            Faturamento = soma do valor das reservas não canceladas no período (inclui faltas e dias futuros do período). O Jogaê ainda não registra pagamentos, por isso não há forma de pagamento nem valor a receber.
          </p>

          <section className="card reports-page__chart-card" aria-labelledby="chart-daily">
            <div className="reports-page__chart-head">
              <h2 id="chart-daily">Faturamento por dia</h2>
              <p>
                {formatDayLabel(dailySeries[0]?.date ?? from)} a {formatDayLabel(dailySeries[dailySeries.length - 1]?.date ?? to)}
              </p>
            </div>
            {hasRevenue ? (
              <AreaChart
                points={dailySeries}
                label={`Faturamento por dia, de ${formatDayLabel(from)} a ${formatDayLabel(to)}`}
              />
            ) : (
              <p className="reports-page__empty">Sem faturamento nesse período. "Este mês" vai só até hoje: reservas de dias que ainda não chegaram aparecem quando você escolhe um período que as inclua.</p>
            )}
          </section>

          <section className="card reports-page__chart-card" aria-labelledby="chart-compare">
            <h2 id="chart-compare">Quadras: este período e o anterior</h2>
            {report.courts.length === 0 || !previousReport ? (
              <p className="reports-page__empty">Sem dados do período anterior para comparar.</p>
            ) : (
              <GroupedBarChart
                currentLabel="Este período"
                previousLabel="Período anterior"
                items={report.courts.map((court) => ({
                  label: court.courtName,
                  current: court.revenue,
                  previous: previousByCourt.get(court.courtId)?.revenue ?? 0,
                }))}
              />
            )}
          </section>

          {report.courts.length > 0 && (
            <section className="card reports-page__table-card" aria-labelledby="table-courts">
              <h2 id="table-courts">Detalhe por quadra</h2>
              <div className="reports-page__table-wrap">
                <table className="reports-page__table">
                  <thead>
                    <tr>
                      <th scope="col">Quadra</th>
                      <th scope="col" className="reports-page__num">Reservas</th>
                      <th scope="col" className="reports-page__num">Faturamento</th>
                      <th scope="col" className="reports-page__num reports-page__col-previous">Período anterior</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.courts.map((court) => (
                      <tr key={court.courtId}>
                        <th scope="row">{court.courtName}</th>
                        <td className="reports-page__num">{court.reservationsCount}</td>
                        <td className="reports-page__num">{formatCurrency(court.revenue)}</td>
                        <td className="reports-page__num reports-page__col-previous">
                          {previousReport ? formatCurrency(previousByCourt.get(court.courtId)?.revenue ?? 0) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th scope="row">Total</th>
                      <td className="reports-page__num">{report.reservationsCount}</td>
                      <td className="reports-page__num">{formatCurrency(report.totalRevenue)}</td>
                      <td className="reports-page__num reports-page__col-previous">
                        {previousReport ? formatCurrency(previousReport.totalRevenue) : '—'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          )}

          {commercialReport && (
            <div className="reports-page__grid">
              <div className="card reports-page__courts">
                <h2>Cupom mais usado</h2>
                {commercialReport.topCoupons.length === 0 ? (
                  <p className="reports-page__empty">Nenhum cupom usado nesse período.</p>
                ) : (
                  <RankBars
                    items={commercialReport.topCoupons.map((coupon) => ({
                      id: coupon.couponId,
                      label: coupon.code,
                      detail: `${coupon.usageCount} ${coupon.usageCount === 1 ? 'uso' : 'usos'}, desconto`,
                      value: coupon.totalDiscount,
                    }))}
                  />
                )}
              </div>

              <div className="card reports-page__courts">
                <h2>Equipamento mais alugado</h2>
                {commercialReport.topEquipment.length === 0 ? (
                  <p className="reports-page__empty">Nenhum equipamento alugado nesse período.</p>
                ) : (
                  <RankBars
                    items={commercialReport.topEquipment.map((item) => ({
                      id: item.equipmentId,
                      label: item.name,
                      detail: `${item.quantityRented} un.`,
                      value: item.revenue,
                    }))}
                  />
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
