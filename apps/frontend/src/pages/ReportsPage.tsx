import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePainelContext } from '../components/panel/PainelLayout'
import { SessionExpiredError } from '../lib/api'
import { fetchCourts } from '../lib/courts'
import type { Court } from '../lib/courts'
import { fetchProfile } from '../lib/profile'
import { downloadReportsCsv, fetchReports } from '../lib/reports'
import type { FinancialReport } from '../lib/reports'
import { toDateInputValue } from '../lib/weekGrid'
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

function formatCurrency(value: number) {
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

function formatDayLabel(dateStr: string) {
  const [, month, day] = dateStr.split('-')
  return `${day}/${month}`
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
    fetchReports({ from, to, courtId: courtId || undefined })
      .then((data) => {
        // Descarta a resposta se um filtro mais recente já disparou outra
        // busca — sem isso, uma resposta mais lenta podia chegar por último
        // e sobrescrever o estado com os dados de um período errado.
        if (requestId !== latestRequestRef.current) return
        setReport(data)
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

  const maxDailyRevenue = report ? Math.max(1, ...report.dailyRevenue.map((d) => d.revenue)) : 1

  return (
    <div className="reports-page">
      <h1>Relatórios financeiros</h1>
      <p className="reports-page__subtitle">Acompanhe o faturamento, a ocupação e o desempenho das suas quadras.</p>

      <div className="reports-page__goal card">
        <div className="reports-page__goal-header">
          <span className="kpi-label">Meta de faturamento do mês</span>
          {monthlyGoal ? (
            <strong className="reports-page__goal-value">
              {formatCurrency(monthRevenue ?? 0)} <span>de {formatCurrency(monthlyGoal)}</span>
            </strong>
          ) : (
            <Link to="/painel/configuracoes" className="reports-page__goal-cta">
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
              <span className="reports-page__stat-icon" aria-hidden="true">💰</span>
              <span className="reports-page__stat-body">
                <span>Faturamento no período</span>
                <strong>{formatCurrency(report.totalRevenue)}</strong>
              </span>
            </div>
            <div className="reports-page__stat">
              <span className="reports-page__stat-icon" aria-hidden="true">📅</span>
              <span className="reports-page__stat-body">
                <span>Reservas no período</span>
                <strong>{report.reservationsCount}</strong>
              </span>
            </div>
            <div className="reports-page__stat">
              <span className="reports-page__stat-icon" aria-hidden="true">📈</span>
              <span className="reports-page__stat-body">
                <span>Taxa de ocupação</span>
                <strong>{Math.round(report.occupancyRate * 100)}%</strong>
              </span>
            </div>
          </div>

          <div className="reports-page__grid">
            <div className="card reports-page__courts">
              <h2>Quadras por faturamento</h2>
              {report.courts.length === 0 && <p className="reports-page__empty">Nenhuma quadra cadastrada ainda.</p>}
              {report.courts.map((court, index) => (
                <div key={court.courtId} className="reports-page__court-row">
                  <span className="reports-page__court-rank">{index + 1}º</span>
                  <span className="reports-page__court-name">{court.courtName}</span>
                  <span className="reports-page__court-count">{court.reservationsCount} reservas</span>
                  <strong className="reports-page__court-revenue">{formatCurrency(court.revenue)}</strong>
                </div>
              ))}
            </div>

            <div className="card reports-page__daily">
              <h2>Faturamento por dia</h2>
              {report.dailyRevenue.length === 0 && <p className="reports-page__empty">Sem reservas nesse período.</p>}
              <div className="reports-page__bars">
                {report.dailyRevenue.map((day) => (
                  <div key={day.date} className="reports-page__bar-col">
                    <div className="reports-page__bar-track">
                      <div
                        className="reports-page__bar-fill"
                        style={{ height: `${Math.max(4, (day.revenue / maxDailyRevenue) * 100)}%` }}
                        title={formatCurrency(day.revenue)}
                      />
                    </div>
                    <span className="reports-page__bar-label">{formatDayLabel(day.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
