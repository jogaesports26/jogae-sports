import { useState } from 'react'
import { useEscapeToClose } from '../../hooks/useEscapeToClose'
import './BookingFlowModal.css'
import './CancelReservationModal.css'

interface CancelReservationModalProps {
  courtName: string
  establishmentName: string | null
  dateLabel: string
  price: number
  onConfirm: () => Promise<void>
  onClose: () => void
}

export default function CancelReservationModal({
  courtName,
  establishmentName,
  dateLabel,
  price,
  onConfirm,
  onClose,
}: CancelReservationModalProps) {
  const [isCancelling, setIsCancelling] = useState(false)
  useEscapeToClose(() => {
    if (!isCancelling) onClose()
  })

  async function handleConfirm() {
    setIsCancelling(true)
    try {
      await onConfirm()
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="booking-modal__overlay" onClick={isCancelling ? undefined : onClose}>
      <div
        className="booking-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cancel-reservation-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="booking-modal__close" onClick={onClose} aria-label="Fechar" disabled={isCancelling}>
          ×
        </button>

        <h2 id="cancel-reservation-title">Cancelar reserva?</h2>

        <div className="cancel-reservation__summary">
          <strong>{courtName}</strong>
          {establishmentName && <span>{establishmentName}</span>}
          <span>{dateLabel}</span>
          <span className="cancel-reservation__price">R$ {price.toFixed(2).replace('.', ',')}</span>
        </div>

        <ul className="cancel-reservation__policy">
          <li>Essa ação não pode ser desfeita — o horário volta a ficar livre pra outros jogadores.</li>
          <li>Cancelamentos só são aceitos até 2 horas antes do horário reservado.</li>
        </ul>

        <div className="cancel-reservation__actions">
          <button type="button" className="booking-modal__invite" onClick={onClose} disabled={isCancelling}>
            Manter reserva
          </button>
          <button
            type="button"
            className="cancel-reservation__confirm"
            onClick={handleConfirm}
            disabled={isCancelling}
          >
            {isCancelling ? 'Cancelando...' : 'Sim, cancelar'}
          </button>
        </div>
      </div>
    </div>
  )
}
