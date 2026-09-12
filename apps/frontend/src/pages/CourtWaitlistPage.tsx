import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useCourtDetailContext } from '../components/panel/CourtDetailLayout'
import { SessionExpiredError } from '../lib/api'
import { fetchWaitlist, removeWaitlistEntry } from '../lib/waitlist'
import type { WaitlistEntry } from '../lib/waitlist'
import './CourtWaitlistPage.css'

export default function CourtWaitlistPage() {
  const { courtId } = useParams<{ courtId: string }>()
  const { onSessionExpired } = useCourtDetailContext()
  const [waitlist, setWaitlist] = useState<WaitlistEntry[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!courtId) return
    fetchWaitlist(courtId)
      .then(setWaitlist)
      .catch((err) => {
        if (err instanceof SessionExpiredError) {
          onSessionExpired()
          return
        }
        setError(err instanceof Error ? err.message : 'Erro ao carregar a fila de espera')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courtId])

  async function handleRemove(id: string) {
    if (!courtId) return
    try {
      await removeWaitlistEntry(courtId, id)
      setWaitlist((prev) => (prev ? prev.filter((entry) => entry.id !== id) : prev))
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
      }
    }
  }

  return (
    <div className="court-waitlist-page">
      <h2>Fila de espera</h2>
      <p className="court-waitlist-page__hint">
        Clientes que pediram pra ser avisados se um horário ocupado abrir. Isso acontece
        automaticamente quando uma reserva daquele horário é cancelada.
      </p>

      {error && <p className="court-waitlist-page__error">{error}</p>}

      {!error && waitlist === null && <p className="court-waitlist-page__loading">Carregando...</p>}

      {waitlist !== null && waitlist.length === 0 && (
        <div className="court-waitlist-page__empty card">
          <p>Ninguém na fila de espera agora.</p>
          <span>
            Quando um horário ocupado dessa quadra abre na sua página pública, o cliente pode entrar na
            fila direto por lá.
          </span>
        </div>
      )}

      {waitlist !== null && waitlist.length > 0 && (
        <div className="court-waitlist-page__list">
          {waitlist.map((entry) => (
            <div key={entry.id} className="court-waitlist-page__item">
              <span className="court-waitlist-page__slot">
                {new Date(entry.startsAt).toLocaleDateString('pt-BR')} ·{' '}
                {new Date(entry.startsAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                {'–'}
                {new Date(entry.endsAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="court-waitlist-page__name">
                <strong>{entry.name}</strong>
                <small>{entry.phone}</small>
              </span>
              <button
                type="button"
                className="court-waitlist-page__remove"
                onClick={() => handleRemove(entry.id)}
                aria-label="Remover da fila"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
