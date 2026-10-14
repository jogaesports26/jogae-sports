import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { usePainelContext } from '../components/panel/PainelLayout'
import CustomerHistoryModal from '../components/panel/CustomerHistoryModal'
import { SessionExpiredError } from '../lib/api'
import {
  downloadCustomersCsv,
  fetchCustomers,
  fetchCustomersSummary,
  INACTIVE_THRESHOLD_DAYS,
  isBirthdayThisMonth,
  NO_SHOW_ALERT_THRESHOLD,
} from '../lib/customers'
import type { Customer, CustomerFilter, CustomersPage as CustomersPageData, CustomersSummary } from '../lib/customers'
import './CustomersPage.css'

const FILTERS: { key: CustomerFilter; label: string; count: keyof CustomersSummary }[] = [
  { key: 'all', label: 'Todos', count: 'total' },
  { key: 'inactive', label: 'Inativos', count: 'inactive' },
  { key: 'birthdays', label: 'Aniversariantes do mês', count: 'birthdays' },
  { key: 'noShows', label: 'Faltas recorrentes', count: 'noShows' },
]

function isFilter(value: string | null): value is CustomerFilter {
  return FILTERS.some((item) => item.key === value)
}

function formatLastSeen(days: number | null, nextAt: string | null) {
  // Quem só tem reserva futura mostra a data da próxima, em vez de repetir "ainda não jogou" em todas as linhas.
  if (days === null) return nextAt ? `Próxima: ${new Date(nextAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}` : '—'
  if (days === 0) return 'Hoje'
  if (days === 1) return 'Ontem'
  return `Há ${days} dias`
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? '?').slice(0, 2)
  return letters.toUpperCase()
}

function formatMoney(value: number) {
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

export default function CustomersPage() {
  const { onSessionExpired } = usePainelContext()
  const [searchParams] = useSearchParams()
  const [data, setData] = useState<CustomersPageData | null>(null)
  const [summary, setSummary] = useState<CustomersSummary | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<CustomerFilter>(() => {
    const fromUrl = searchParams.get('filtro')
    return isFilter(fromUrl) ? fromUrl : 'all'
  })
  const [search, setSearch] = useState(() => searchParams.get('busca') ?? '')
  const [debouncedSearch, setDebouncedSearch] = useState(() => (searchParams.get('busca') ?? '').trim())
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Customer | null>(null)
  const [exporting, setExporting] = useState(false)

  function handleError(err: unknown, fallback: string) {
    if (err instanceof SessionExpiredError) {
      onSessionExpired()
      return
    }
    setError(err instanceof Error ? err.message : fallback)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    fetchCustomersSummary()
      .then(setSummary)
      .catch(() => setSummary(null))
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchCustomers({ q: debouncedSearch, filtro: filter, pagina: page })
      .then((result) => {
        if (cancelled) return
        setError('')
        setData(result)
      })
      .catch((err) => {
        if (!cancelled) handleError(err, 'Erro ao carregar os clientes')
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filter, page])

  function selectFilter(key: CustomerFilter) {
    setFilter(key)
    setPage(1)
  }

  function handleSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleBirthDateSaved(updated: Customer) {
    setData((prev) =>
      prev ? { ...prev, items: prev.items.map((c) => (c.phone === updated.phone ? updated : c)) } : prev,
    )
    setSelected(updated)
  }

  async function handleExport() {
    setExporting(true)
    try {
      await downloadCustomersCsv()
    } catch (err) {
      handleError(err, 'Não foi possível exportar os clientes')
    } finally {
      setExporting(false)
    }
  }

  const currentMonth = new Date().getMonth()
  const items = data?.items ?? []
  const filtering = filter !== 'all' || debouncedSearch !== ''
  const from = data && data.total > 0 ? (data.pagina - 1) * data.porPagina + 1 : 0
  const to = data ? from + items.length - (items.length ? 1 : 0) : 0

  return (
    <div className="customers-page">
      <h1>Clientes</h1>
      <p className="customers-page__subtitle">
        Histórico, frequência e alertas dos clientes que já reservaram na sua arena.
      </p>

      <div className="customers-page__toolbar">
        <div className="customers-page__tabs" role="group" aria-label="Filtrar clientes">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={filter === item.key}
              className={`customers-page__tab ${filter === item.key ? 'customers-page__tab--active' : ''}`}
              onClick={() => selectFilter(item.key)}
            >
              {item.label}
              {summary && <span className="customers-page__tab-count">{summary[item.count]}</span>}
            </button>
          ))}
        </div>

        <input
          className="customers-page__search"
          type="search"
          aria-label="Buscar cliente por nome ou telefone"
          value={search}
          onChange={(event) => handleSearch(event.target.value)}
          placeholder="Buscar por nome ou telefone"
        />

        <button
          type="button"
          className="btn btn--outline btn--sm"
          onClick={handleExport}
          disabled={exporting || (summary !== null && summary.total === 0)}
        >
          {exporting ? 'Exportando...' : 'Exportar CSV'}
        </button>
      </div>

      {error && <p className="customers-page__error" role="alert">{error}</p>}
      {!error && data === null && <p className="customers-page__loading">Carregando...</p>}

      {data !== null && items.length === 0 && (
        <div className="customers-page__empty card">
          <p>Nenhum cliente encontrado {filtering ? 'com esse filtro' : 'ainda'}.</p>
          {filtering ? (
            <span>
              Tente outro nome ou telefone.{' '}
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  setFilter('all')
                  setSearch('')
                  setPage(1)
                }}
              >
                Limpar filtro e busca
              </button>
            </span>
          ) : (
            <span>
              Os clientes aparecem aqui depois da primeira reserva.{' '}
              <Link to="/painel/configuracoes?aba=lojinha">Veja o link da sua lojinha</Link> para divulgar.
            </span>
          )}
        </div>
      )}

      {items.length > 0 && (
        <div className="customers-page__table-wrap">
          <table className="customers-page__table">
            <thead>
              <tr>
                <th scope="col">Cliente</th>
                <th scope="col">Alertas</th>
                <th scope="col" className="customers-page__num">Reservas</th>
                <th scope="col" className="customers-page__num">Gasto total</th>
                <th scope="col">Última reserva</th>
              </tr>
            </thead>
            <tbody>
              {items.map((customer) => {
                const birthday = isBirthdayThisMonth(customer.birthDate, currentMonth)
                const inactive =
                  customer.daysSinceLastReservation !== null &&
                  customer.daysSinceLastReservation >= INACTIVE_THRESHOLD_DAYS
                return (
                  <tr key={customer.phone}>
                    <td>
                      <button type="button" className="customers-page__who" onClick={() => setSelected(customer)}>
                        <span className="customers-page__avatar" aria-hidden="true">{initials(customer.name)}</span>
                        <span className="customers-page__who-text">
                          <strong>{customer.name}</strong>
                          <small>{customer.phone}</small>
                        </span>
                      </button>
                    </td>
                    <td>
                      <span className="customers-page__badges">
                        {birthday && <span className="pill pill--warning">Aniversário</span>}
                        {customer.noShowCount >= NO_SHOW_ALERT_THRESHOLD && (
                          <span className="pill pill--negative">{customer.noShowCount} faltas</span>
                        )}
                        {inactive && <span className="pill pill--neutral">Inativo</span>}
                      </span>
                    </td>
                    <td className="customers-page__num">{customer.totalReservations}</td>
                    <td className="customers-page__num">{formatMoney(customer.totalSpent)}</td>
                    <td>{formatLastSeen(customer.daysSinceLastReservation, customer.nextReservationAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {data !== null && data.total > 0 && (
        <nav className="customers-page__pager" aria-label="Paginação">
          <span>
            {from}–{to} de {data.total}
          </span>
          <span className="customers-page__pager-buttons">
            <button
              type="button"
              className="btn btn--outline btn--sm"
              disabled={data.pagina <= 1}
              onClick={() => setPage(data.pagina - 1)}
            >
              Anterior
            </button>
            <span>
              Página {data.pagina} de {data.totalPaginas}
            </span>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              disabled={data.pagina >= data.totalPaginas}
              onClick={() => setPage(data.pagina + 1)}
            >
              Próxima
            </button>
          </span>
        </nav>
      )}

      {selected && (
        <CustomerHistoryModal
          customer={selected}
          onClose={() => setSelected(null)}
          onSessionExpired={onSessionExpired}
          onBirthDateSaved={handleBirthDateSaved}
        />
      )}
    </div>
  )
}
