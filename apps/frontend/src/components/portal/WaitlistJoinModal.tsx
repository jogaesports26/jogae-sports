import { useState } from 'react'
import type { FormEvent } from 'react'
import { useEscapeToClose } from '../../hooks/useEscapeToClose'
import { joinWaitlist } from '../../lib/waitlist'
import { formatMinutes } from '../../lib/weekGrid'
import { getPlayerUser } from '../../lib/player'
import { FORMATTED_PHONE_MIN_LENGTH, formatPhone, phoneDigits } from '../../lib/phone'
import './BookingFlowModal.css'

interface WaitlistJoinModalProps {
  courtId: string
  courtName: string
  dayLabel: string
  dayDate: Date
  startMinute: number
  endMinute: number
  onClose: () => void
}

function toISOAt(dayDate: Date, minutes: number) {
  const date = new Date(dayDate)
  date.setHours(0, minutes, 0, 0)
  return date.toISOString()
}

export default function WaitlistJoinModal({
  courtId,
  courtName,
  dayLabel,
  dayDate,
  startMinute,
  endMinute,
  onClose,
}: WaitlistJoinModalProps) {
  useEscapeToClose(onClose)
  const [name, setName] = useState(() => getPlayerUser()?.name ?? '')
  const [phone, setPhone] = useState(() => phoneDigits(getPlayerUser()?.phone ?? ''))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      await joinWaitlist(courtId, {
        name,
        phone,
        startsAt: toISOAt(dayDate, startMinute),
        endsAt: toISOAt(dayDate, endMinute),
      })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar na fila')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="booking-modal__overlay" onClick={onClose}>
      <div className="booking-modal" onClick={(event) => event.stopPropagation()}>
        <button className="booking-modal__close" onClick={onClose} aria-label="Fechar">
          ×
        </button>

        <h2>{courtName}</h2>
        <p className="booking-modal__slot">
          {dayLabel} · {formatMinutes(startMinute)} – {formatMinutes(endMinute)}
        </p>

        {error && <p className="booking-modal__error">{error}</p>}

        {done ? (
          <div className="booking-modal__form">
            <p className="booking-modal__success">
              Você entrou na fila! Se esse horário abrir, avisamos você por telefone.
            </p>
            <button className="booking-modal__submit" onClick={onClose}>
              Fechar
            </button>
          </div>
        ) : (
          <form className="booking-modal__form" onSubmit={handleSubmit}>
            <p className="booking-modal__hint">
              Esse horário está ocupado. Deixe seu nome e telefone pra a gente avisar se ele abrir.
            </p>
            <label className="booking-modal__field">
              <span>Nome</span>
              <input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} />
            </label>
            <label className="booking-modal__field">
              <span>Telefone</span>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={formatPhone(phone)}
                onChange={(event) => setPhone(phoneDigits(event.target.value))}
                placeholder="(85) 99999-9999"
                required
                minLength={FORMATTED_PHONE_MIN_LENGTH}
              />
            </label>
            <button type="submit" className="booking-modal__submit" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar na fila de espera'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
