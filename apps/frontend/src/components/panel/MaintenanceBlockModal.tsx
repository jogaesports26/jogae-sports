import { useState } from 'react'
import type { FormEvent } from 'react'
import { SessionExpiredError } from '../../lib/api'
import { createMaintenanceBlock } from '../../lib/reservations'
import './ReservationModal.css'

interface MaintenanceBlockModalProps {
  courtId: string
  onClose: () => void
  onCreated: () => void
  onSessionExpired: () => void
}

export default function MaintenanceBlockModal({
  courtId,
  onClose,
  onCreated,
  onSessionExpired,
}: MaintenanceBlockModalProps) {
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [reason, setReason] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSaving(true)
    setError('')

    try {
      await createMaintenanceBlock(courtId, {
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        reason: reason || undefined,
      })
      onCreated()
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
        return
      }
      setError(err instanceof Error ? err.message : 'Não foi possível criar o bloqueio')
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

        <h2>Bloquear horário</h2>
        <p className="reservation-modal__slot">Pra manutenção, limpeza ou qualquer indisponibilidade.</p>

        <form onSubmit={handleSubmit} className="reservation-modal__form">
          <label className="reservation-modal__field">
            <span>Início</span>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              required
            />
          </label>

          <label className="reservation-modal__field">
            <span>Fim</span>
            <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required />
          </label>

          <label className="reservation-modal__field">
            <span>Motivo (opcional)</span>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex: manutenção do piso" />
          </label>

          {error && <p className="reservation-modal__error">{error}</p>}

          <button type="submit" className="reservation-modal__submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Bloquear horário'}
          </button>
        </form>
      </div>
    </div>
  )
}
