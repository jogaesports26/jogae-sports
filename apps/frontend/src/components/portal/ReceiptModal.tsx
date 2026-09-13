import { useState } from 'react'
import { useEscapeToClose } from '../../hooks/useEscapeToClose'
import { shareOrCopy } from '../../lib/share'
import type { ShareResult } from '../../lib/share'
import './BookingFlowModal.css'
import './ReceiptModal.css'

interface ReceiptModalProps {
  courtName: string
  establishmentName: string | null
  dateLabel: string
  price: number
  shareUrl: string
  onClose: () => void
}

export default function ReceiptModal({
  courtName,
  establishmentName,
  dateLabel,
  price,
  shareUrl,
  onClose,
}: ReceiptModalProps) {
  useEscapeToClose(onClose)
  const [shareResult, setShareResult] = useState<ShareResult | null>(null)

  async function handleShare() {
    const result = await shareOrCopy({
      title: `Comprovante — ${courtName}`,
      text: `Reserva confirmada: ${courtName}${establishmentName ? ` (${establishmentName})` : ''}, ${dateLabel}.`,
      url: shareUrl,
    })
    setShareResult(result)
  }

  return (
    <div className="booking-modal__overlay" onClick={onClose}>
      <div className="booking-modal receipt-print" onClick={(event) => event.stopPropagation()}>
        <button className="booking-modal__close receipt-modal__no-print" onClick={onClose} aria-label="Fechar">
          ×
        </button>

        <p className="receipt-modal__eyebrow">Comprovante de reserva</p>
        <h2>{courtName}</h2>
        {establishmentName && <p className="booking-modal__slot">{establishmentName}</p>}
        <p className="receipt-modal__date">{dateLabel}</p>
        <p className="receipt-modal__price">R$ {price.toFixed(2).replace('.', ',')}</p>

        <img
          className="receipt-modal__qr"
          src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(shareUrl)}`}
          alt="QR code da quadra"
          width={140}
          height={140}
        />

        <div className="receipt-modal__actions receipt-modal__no-print">
          <button type="button" className="booking-modal__invite" onClick={handleShare}>
            Compartilhar
          </button>
          <button type="button" className="booking-modal__invite" onClick={() => window.print()}>
            Imprimir
          </button>
        </div>
        {shareResult === 'copied' && (
          <p className="booking-modal__hint receipt-modal__no-print">Link copiado! Cole numa conversa.</p>
        )}
      </div>
    </div>
  )
}
