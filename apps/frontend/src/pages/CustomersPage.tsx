import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePainelContext } from '../components/panel/PainelLayout'
import CustomerHistoryModal from '../components/panel/CustomerHistoryModal'
import { SessionExpiredError } from '../lib/api'
import {
  downloadCustomersCsv,
  fetchCustomers,
  INACTIVE_THRESHOLD_DAYS,
  isBirthdayThisMonth,
  NO_SHOW_ALERT_THRESHOLD,
} from '../lib/customers'
import type { Customer } from '../lib/customers'
import './CustomersPage.css'

type FilterTab = 'all' | 'inactive' | 'birthdays' | 'noShows'

const FILTER_LABELS: Record<FilterTab, string> = {
  all: 'Todos',
  inactive: 'Inativos',
  birthdays: 'Aniversariantes do mês',
  noShows: 'Faltas recorrentes',
}

function isFilterTab(value: string | null): value is FilterTab {
  return value === 'all' || value === 'inactive' || value === 'birthdays' || value === 'noShows'
}

function formatLastSeen(days: number) {
  if (days === 0) return 'Hoje'
  if (days === 1) return 'Ontem'
  return `Há ${days} dias`
}

export default function CustomersPage() {
  const { onSessionExpired } = usePainelContext()
  const [searchParams] = useSearchParams()
  const [customers, setCustomers] = useState<Customer[] | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<FilterTab>(() => {
    const fromUrl = searchParams.get('filtro')
    return isFilterTab(fromUrl) ? fromUrl : 'all'
  })
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Customer | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchCustomers()
      .then(setCustomers)
      .catch((err) => {
        if (err instanceof SessionExpiredError) {
          onSessionExpired()
          return
        }
        setError(err instanceof Error ? err.message : 'Erro ao carregar os clientes')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentMonth = useMemo(() => new Date().getMonth(), [])

  const filtered = useMemo(() => {
    if (!customers) return []
    const term = search.trim().toLowerCase()

    return customers.filter((customer) => {
      if (term && !customer.name.toLowerCase().includes(term) && !customer.phone.includes(term)) {
        return false
      }
      if (filter === 'inactive') return customer.daysSinceLastReservation >= INACTIVE_THRESHOLD_DAYS
      if (filter === 'birthdays') return isBirthdayThisMonth(customer.birthDate, currentMonth)
      if (filter === 'noShows') return customer.noShowCount >= NO_SHOW_ALERT_THRESHOLD
      return true
    })
  }, [customers, filter, search, currentMonth])

  function handleBirthDateSaved(updated: Customer) {
    setCustomers((prev) => (prev ? prev.map((c) => (c.phone === updated.phone ? updated : c)) : prev))
    setSelected(updated)
  }

  async function handleExport() {
    setExporting(true)
    try {
      await downloadCustomersCsv()
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
        return
      }
      setError(err instanceof Error ? err.message : 'Não foi possível exportar os clientes')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="customers-page">
      <h1>Clientes</h1>
      <p className="customers-page__subtitle">
        Histórico, frequência e alertas dos clientes que já reservaram na sua arena.
      </p>

      <div className="customers-page__toolbar">
        <div className="customers-page__tabs">
          {(Object.keys(FILTER_LABELS) as FilterTab[]).map((key) => (
            <button
              key={key}
              type="button"
              className={`customers-page__tab ${filter === key ? 'customers-page__tab--active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {FILTER_LABELS[key]}
            </button>
          ))}
        </div>

        <input
          className="customers-page__search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nome ou telefone"
        />

        <button
          type="button"
          className="btn btn--outline btn--sm"
          onClick={handleExport}
          disabled={exporting || !customers || customers.length === 0}
        >
          {exporting ? 'Exportando...' : 'Exportar CSV'}
        </button>
      </div>

      {error && <p className="customers-page__error">{error}</p>}

      {!error && customers === null && <p className="customers-page__loading">Carregando...</p>}

      {customers !== null && filtered.length === 0 && (
        <div className="customers-page__empty card">
          <p>Nenhum cliente encontrado {filter !== 'all' || search ? 'com esse filtro' : 'ainda'}.</p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="customers-page__list">
          {filtered.map((customer) => {
            const birthday = isBirthdayThisMonth(customer.birthDate, currentMonth)
            const inactive = customer.daysSinceLastReservation >= INACTIVE_THRESHOLD_DAYS
            const flagged = customer.noShowCount >= NO_SHOW_ALERT_THRESHOLD

            return (
              <button
                key={customer.phone}
                type="button"
                className="customers-page__row"
                onClick={() => setSelected(customer)}
              >
                <span className="customers-page__row-identity">
                  <strong>{customer.name}</strong>
                  <small>{customer.phone}</small>
                </span>

                <span className="customers-page__row-badges">
                  {birthday && <span className="pill pill--info">🎂 Aniversário</span>}
                  {flagged && <span className="pill pill--negative">{customer.noShowCount} faltas</span>}
                  {inactive && <span className="pill pill--neutral">Inativo</span>}
                </span>

                <span className="customers-page__row-stat">
                  <small>Reservas</small>
                  {customer.totalReservations}
                </span>
                <span className="customers-page__row-stat">
                  <small>Gasto total</small>
                  R$ {customer.totalSpent.toFixed(2).replace('.', ',')}
                </span>
                <span className="customers-page__row-stat customers-page__row-stat--last">
                  <small>Última reserva</small>
                  {formatLastSeen(customer.daysSinceLastReservation)}
                </span>
              </button>
            )
          })}
        </div>
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
