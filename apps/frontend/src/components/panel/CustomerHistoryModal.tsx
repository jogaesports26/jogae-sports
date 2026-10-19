import { useEffect, useState } from 'react'
import { useEscapeToClose } from '../../hooks/useEscapeToClose'
import { SessionExpiredError } from '../../lib/api'
import type { Customer, CustomerReservation } from '../../lib/customers'
import { fetchCustomerHistory, updateCustomerBirthDate } from '../../lib/customers'
import { averageTicket, customerInsights, whatsappLink } from '../../lib/customerInsights'
import { formatPhone } from '../../lib/phone'
import './CustomerHistoryModal.css'

const STATUS_LABELS: Record<CustomerReservation['status'], string> = {
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Concluída',
  NO_SHOW: 'Não compareceu',
}

function formatMoney(value: number) {
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

function toDateInputValue(iso: string) {
  return iso.slice(0, 10)
}

interface CustomerHistoryModalProps {
  customer: Customer
  onClose: () => void
  onSessionExpired: () => void
  onBirthDateSaved: (customer: Customer) => void
}

export default function CustomerHistoryModal({
  customer,
  onClose,
  onSessionExpired,
  onBirthDateSaved,
}: CustomerHistoryModalProps) {
  useEscapeToClose(onClose)
  const [reservations, setReservations] = useState<CustomerReservation[] | null>(null)
  const [error, setError] = useState('')
  const [birthDate, setBirthDate] = useState(customer.birthDate ? toDateInputValue(customer.birthDate) : '')
  const [savingBirthDate, setSavingBirthDate] = useState(false)
  const insights = reservations ? customerInsights(reservations) : null

  useEffect(() => {
    fetchCustomerHistory(customer.phone)
      .then(setReservations)
      .catch((err) => {
        if (err instanceof SessionExpiredError) {
          onSessionExpired()
          return
        }
        setError(err instanceof Error ? err.message : 'Erro ao carregar o histórico')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.phone])

  async function handleSaveBirthDate() {
    if (!customer.playerId || !birthDate) return
    setSavingBirthDate(true)
    setError('')
    try {
      const updated = await updateCustomerBirthDate(customer.playerId, birthDate)
      onBirthDateSaved({ ...customer, birthDate: updated.birthDate })
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
        return
      }
      setError(err instanceof Error ? err.message : 'Não foi possível salvar')
    } finally {
      setSavingBirthDate(false)
    }
  }

  return (
    <div className="customer-modal__overlay" onClick={onClose}>
      <div className="customer-modal" onClick={(event) => event.stopPropagation()}>
        <button className="customer-modal__close" onClick={onClose} aria-label="Fechar">
          ×
        </button>

        <h2>{customer.name}</h2>
        <p className="customer-modal__phone">
          {formatPhone(customer.phone)}
          {whatsappLink(customer.phone) && (
            <a
              className="btn btn--outline btn--sm customer-modal__whatsapp"
              href={whatsappLink(customer.phone) ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
            >
              Chamar no WhatsApp
            </a>
          )}
        </p>

        <dl className="customer-modal__stats">
          <div>
            <dt>Reservas</dt>
            <dd>{customer.totalReservations}</dd>
          </div>
          <div>
            <dt>Gasto total</dt>
            <dd>{formatMoney(customer.totalSpent)}</dd>
          </div>
          <div>
            <dt>Ticket médio</dt>
            <dd>{formatMoney(averageTicket(customer.totalSpent, customer.totalReservations))}</dd>
          </div>
          <div className={customer.noShowCount > 0 ? 'customer-modal__stat--alert' : undefined}>
            <dt>Faltas</dt>
            <dd>{customer.noShowCount}</dd>
          </div>
          <div>
            <dt>Cancelamentos</dt>
            <dd>{insights ? insights.cancelled : '…'}</dd>
          </div>
          <div>
            <dt>Cliente desde</dt>
            <dd>{insights?.firstAt ? new Date(insights.firstAt).toLocaleDateString('pt-BR') : '—'}</dd>
          </div>
          <div>
            <dt>Quadra favorita</dt>
            <dd>{insights ? (insights.favoriteCourt ?? '—') : '…'}</dd>
          </div>
          <div>
            <dt>Próxima reserva</dt>
            <dd>
              {customer.nextReservationAt
                ? new Date(customer.nextReservationAt).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—'}
            </dd>
          </div>
        </dl>

        {customer.playerId ? (
          <div className="customer-modal__birthdate">
            <label className="field field--sm">
              <span>Data de nascimento</span>
              <input
                className="input"
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
              />
            </label>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              disabled={savingBirthDate || !birthDate}
              onClick={handleSaveBirthDate}
            >
              {savingBirthDate ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        ) : (
          <p className="customer-modal__hint">
            Esse cliente reservou como convidado — a data de nascimento só pode ser cadastrada por
            clientes com conta.
          </p>
        )}

        {error && <p className="customer-modal__error">{error}</p>}

        <h3>Histórico de reservas</h3>

        {reservations === null && !error && <p className="customer-modal__loading">Carregando...</p>}

        {reservations !== null && (
          <div className="customer-modal__list">
            {reservations.map((reservation) => (
              <div key={reservation.id} className="customer-modal__item">
                <span className="customer-modal__item-date">
                  {new Date(reservation.startsAt).toLocaleDateString('pt-BR')}{' '}
                  <small>
                    {new Date(reservation.startsAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </small>
                </span>
                <span className="customer-modal__item-court">{reservation.court.name}</span>
                <span
                  className={`customer-modal__item-status customer-modal__item-status--${reservation.status.toLowerCase()}`}
                >
                  {STATUS_LABELS[reservation.status]}
                </span>
                <strong className="customer-modal__item-price">
                  R$ {Number(reservation.priceSnapshot).toFixed(2).replace('.', ',')}
                </strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
