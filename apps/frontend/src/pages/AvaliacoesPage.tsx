import { useEffect, useState } from 'react'
import { usePainelContext } from '../components/panel/PainelLayout'
import { SessionExpiredError } from '../lib/api'
import { fetchOwnerReviews, replyToReview } from '../lib/reviews'
import type { OwnerReview } from '../lib/reviews'
import './AvaliacoesPage.css'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AvaliacoesPage() {
  const { onSessionExpired } = usePainelContext()
  const [reviews, setReviews] = useState<OwnerReview[] | null>(null)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [replyError, setReplyError] = useState('')

  function load() {
    fetchOwnerReviews()
      .then(setReviews)
      .catch((err) => {
        if (err instanceof SessionExpiredError) {
          onSessionExpired()
          return
        }
        setError(err instanceof Error ? err.message : 'Erro ao carregar as avaliações')
      })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function startEditing(review: OwnerReview) {
    setEditingId(review.id)
    setDraft(review.ownerReply ?? '')
    setReplyError('')
  }

  async function handleSaveReply(id: string) {
    setIsSaving(true)
    setReplyError('')
    try {
      const updated = await replyToReview(id, draft.trim())
      setReviews((prev) => (prev ? prev.map((r) => (r.id === updated.id ? updated : r)) : prev))
      setEditingId(null)
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
        return
      }
      setReplyError(err instanceof Error ? err.message : 'Não foi possível salvar a resposta')
    } finally {
      setIsSaving(false)
    }
  }

  const averageRating =
    reviews && reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null
  const unansweredCount = reviews?.filter((r) => !r.ownerReply).length ?? 0

  return (
    <div className="avaliacoes-page">
      <h1>Avaliações</h1>
      <p className="avaliacoes-page__subtitle">
        O que os clientes disseram sobre suas quadras. Sua resposta aparece publicamente na lojinha, logo
        abaixo do comentário.
      </p>

      {averageRating !== null && reviews && (
        <div className="avaliacoes-page__summary card">
          <div className="avaliacoes-page__summary-score">
            <strong>{averageRating.toFixed(1).replace('.', ',')}</strong>
            <span className="avaliacoes-page__stars" aria-hidden="true">
              {'★'.repeat(Math.round(averageRating))}
              {'☆'.repeat(5 - Math.round(averageRating))}
            </span>
          </div>
          <div className="avaliacoes-page__summary-meta">
            <span>
              {reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'}
            </span>
            {unansweredCount > 0 && (
              <span className="pill pill--warning">
                {unansweredCount} sem resposta
              </span>
            )}
          </div>
        </div>
      )}

      {error && <p className="avaliacoes-page__error">{error}</p>}

      {!error && reviews === null && <p className="avaliacoes-page__loading">Carregando...</p>}

      {reviews !== null && reviews.length === 0 && (
        <div className="avaliacoes-page__empty card">
          <p>Nenhuma avaliação recebida ainda.</p>
          <span>Elas aparecem aqui depois que um jogador avalia uma reserva concluída.</span>
        </div>
      )}

      {reviews !== null && reviews.length > 0 && (
        <div className="avaliacoes-page__list">
          {reviews.map((review) => (
            <div key={review.id} className="avaliacoes-page__item card">
              <div className="avaliacoes-page__item-header">
                <div>
                  <span className="avaliacoes-page__stars">
                    {'★'.repeat(review.rating)}
                    {'☆'.repeat(5 - review.rating)}
                  </span>
                  <span className="avaliacoes-page__court">{review.court.name}</span>
                </div>
                <span className="avaliacoes-page__meta">
                  {review.player.name ?? 'Jogador'} · {formatDate(review.createdAt)}
                </span>
              </div>

              {review.comment && <p className="avaliacoes-page__comment">{review.comment}</p>}

              {editingId === review.id ? (
                <div className="avaliacoes-page__reply-form">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Escreva uma resposta pública pra essa avaliação..."
                    rows={3}
                    maxLength={500}
                  />
                  {replyError && <p className="avaliacoes-page__reply-error">{replyError}</p>}
                  <div className="avaliacoes-page__reply-actions">
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditingId(null)}>
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={() => handleSaveReply(review.id)}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Salvando...' : 'Salvar resposta'}
                    </button>
                  </div>
                </div>
              ) : review.ownerReply ? (
                <div className="avaliacoes-page__reply">
                  <span className="avaliacoes-page__reply-label">Sua resposta</span>
                  <p>{review.ownerReply}</p>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => startEditing(review)}>
                    Editar resposta
                  </button>
                </div>
              ) : (
                <button type="button" className="btn btn--outline btn--sm" onClick={() => startEditing(review)}>
                  Responder
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
