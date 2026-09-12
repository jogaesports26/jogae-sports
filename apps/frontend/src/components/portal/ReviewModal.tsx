import { useState } from 'react'
import type { FormEvent } from 'react'
import { useEscapeToClose } from '../../hooks/useEscapeToClose'
import { createReview } from '../../lib/player'
import './ReviewModal.css'

interface ReviewModalProps {
  reservationId: string
  courtName: string
  onClose: () => void
  onSubmitted: () => void
}

export default function ReviewModal({ reservationId, courtName, onClose, onSubmitted }: ReviewModalProps) {
  useEscapeToClose(onClose)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    try {
      await createReview(reservationId, { rating, comment: comment.trim() || undefined })
      onSubmitted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar a avaliação')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="review-modal__overlay" onClick={onClose}>
      <div className="review-modal" onClick={(event) => event.stopPropagation()}>
        <button className="review-modal__close" onClick={onClose} aria-label="Fechar">
          ×
        </button>

        <h2>Avaliar {courtName}</h2>

        <form onSubmit={handleSubmit} className="review-modal__form">
          <div className="review-modal__stars">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                type="button"
                key={value}
                className={`review-modal__star ${value <= rating ? 'review-modal__star--filled' : ''}`}
                onClick={() => setRating(value)}
                aria-label={`${value} estrela${value > 1 ? 's' : ''}`}
              >
                ★
              </button>
            ))}
          </div>

          <label className="review-modal__field">
            <span>Comentário (opcional)</span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={3}
              placeholder="Conte como foi sua experiência..."
            />
          </label>

          {error && <p className="review-modal__error">{error}</p>}

          <button type="submit" className="review-modal__submit" disabled={isSaving}>
            {isSaving ? 'Enviando...' : 'Enviar avaliação'}
          </button>
        </form>
      </div>
    </div>
  )
}
