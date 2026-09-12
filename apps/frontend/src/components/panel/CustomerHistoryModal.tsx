import { useEffect, useState } from 'react'
import { useEscapeToClose } from '../../hooks/useEscapeToClose'
import { SessionExpiredError } from '../../lib/api'
import type { Customer, CustomerReservation } from '../../lib/customers'
import { fetchCustomerHistory, updateCustomerBirthDate } from '../../lib/customers'
import './CustomerHistoryModal.css'

const STATUS_LABELS: Record<CustomerReservation['status'], string> = {
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Concluída',
  NO_SHOW: 'Não compareceu',
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
        <p className="customer-modal__phone">{customer.phone}</p>

        <div className="customer-modal__summary">
          <span>
            <strong>{customer.totalReservations}</strong> reservas
          </span>
          <span>
            <strong>R$ {customer.totalSpent.toFixed(2).replace('.', ',')}</strong> gastos
          </span>
          {customer.noShowCount > 0 && (
            <span className="customer-modal__no-show">
              <strong>{customer.noShowCount}</strong> faltas
            </span>
          )}
        </div>

        {customer.playerId ? (
          <div className="customer-modal__birthdate">
            <label>
              <span>Data de nascimento</span>
              <input
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
                  {new Date(reservation.startsAt).toLocaleDateString('pt-BR')}
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
