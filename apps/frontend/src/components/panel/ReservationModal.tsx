import { useState } from 'react'
import type { FormEvent } from 'react'
import { useEscapeToClose } from '../../hooks/useEscapeToClose'
import { SessionExpiredError } from '../../lib/api'
import type { PriceRule } from '../../lib/courts'
import { createReservation } from '../../lib/reservations'
import { formatMinutes } from '../../lib/weekGrid'
import './ReservationModal.css'

interface ReservationModalProps {
  courtId: string
  dayDate: Date
  dayOfWeek: number
  startMinute: number
  endOptions: number[]
  priceRules: PriceRule[]
  onClose: () => void
  onCreated: () => void
  onSessionExpired: () => void
}

function calcPrice(dayOfWeek: number, startMinute: number, endMinute: number, priceRules: PriceRule[]) {
  const dayRules = priceRules.filter((r) => r.dayOfWeek === dayOfWeek).sort((a, b) => a.startMinute - b.startMinute)
  let cursor = startMinute
  let total = 0
  while (cursor < endMinute) {
    const rule = dayRules.find((r) => r.startMinute === cursor)
    if (!rule) break
    const segmentEnd = Math.min(rule.endMinute, endMinute)
    total += Number(rule.pricePerHour) * ((segmentEnd - cursor) / 60)
    cursor = rule.endMinute
  }
  return total
}

function toISOAt(dayDate: Date, minutes: number) {
  const date = new Date(dayDate)
  date.setHours(0, minutes, 0, 0)
  return date.toISOString()
}

export default function ReservationModal({
  courtId,
  dayDate,
  dayOfWeek,
  startMinute,
  endOptions,
  priceRules,
  onClose,
  onCreated,
  onSessionExpired,
}: ReservationModalProps) {
  useEscapeToClose(onClose)
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [endMinute, setEndMinute] = useState(endOptions[0])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const price = calcPrice(dayOfWeek, startMinute, endMinute, priceRules)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSaving(true)
    setError('')

    try {
      await createReservation(courtId, {
        guestName,
        guestPhone,
        startsAt: toISOAt(dayDate, startMinute),
        endsAt: toISOAt(dayDate, endMinute),
      })
      onCreated()
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
        return
      }
      setError(err instanceof Error ? err.message : 'Não foi possível criar a reserva')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="reservation-modal__overlay" onClick={onClose}>
      <div className="reservation-modal" onClick={(event) => event.stopPropagation()}>
        <button className="reservation-modal__close" onClick={onClose} aria-label="Fechar">
          ×
        </button>

        <h2>Nova reserva</h2>
        <p className="reservation-modal__slot">
          {formatMinutes(startMinute)} – {formatMinutes(endMinute)}
        </p>

        <form onSubmit={handleSubmit} className="reservation-modal__form">
          <label className="reservation-modal__field">
            <span>Nome do cliente</span>
            <input value={guestName} onChange={(e) => setGuestName(e.target.value)} required minLength={2} />
          </label>

          <label className="reservation-modal__field">
            <span>Telefone</span>
            <input
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              required
              minLength={8}
              placeholder="(85) 99999-9999"
            />
          </label>

          <label className="reservation-modal__field">
            <span>Duração</span>
            <select value={endMinute} onChange={(e) => setEndMinute(Number(e.target.value))}>
              {endOptions.map((option) => (
                <option key={option} value={option}>
                  até {formatMinutes(option)}
                </option>
              ))}
            </select>
          </label>

          <p className="reservation-modal__price">
            Total: <strong>R$ {price.toFixed(2).replace('.', ',')}</strong>
          </p>

          {error && <p className="reservation-modal__error">{error}</p>}

          <button type="submit" className="reservation-modal__submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Confirmar reserva'}
          </button>
        </form>
      </div>
    </div>
  )
}
