import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SessionExpiredError } from '../../lib/api'
import { fetchCourts, SPORT_OPTIONS, SURFACE_OPTIONS } from '../../lib/courts'
import type { Court } from '../../lib/courts'
import CourtFormModal from './CourtFormModal'
import './CourtList.css'

const sportLabel = (value: string) => SPORT_OPTIONS.find((option) => option.value === value)?.label ?? value
const surfaceLabel = (value: string) =>
  SURFACE_OPTIONS.find((option) => option.value === value)?.label ?? value

interface CourtListProps {
  onSessionExpired: () => void
}

export default function CourtList({ onSessionExpired }: CourtListProps) {
  const [courts, setCourts] = useState<Court[] | null>(null)
  const [error, setError] = useState('')
  const [editingCourt, setEditingCourt] = useState<Court | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  async function load() {
    try {
      setCourts(await fetchCourts())
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
        return
      }
      setError(err instanceof Error ? err.message : 'Erro ao carregar quadras')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSaved() {
    setIsCreating(false)
    setEditingCourt(null)
    load()
  }

  function closeModal() {
    setIsCreating(false)
    setEditingCourt(null)
  }

  if (error) {
    return <p className="court-list__error">{error}</p>
  }

  if (courts === null) {
    return <p className="court-list__loading">Carregando quadras...</p>
  }

  return (
    <div className="court-list">
      <div className="court-list__toolbar">
        <button className="court-list__new-button" onClick={() => setIsCreating(true)}>
          + Nova quadra
        </button>
      </div>

      {courts.length === 0 ? (
        <div className="court-list__empty">
          <p>Nenhuma quadra cadastrada ainda.</p>
          <button className="court-list__new-button" onClick={() => setIsCreating(true)}>
            Cadastrar primeira quadra
          </button>
        </div>
      ) : (
        <div className="court-list__grid">
          {courts.map((court) => (
            <div key={court.id} className={`court-card ${court.active ? '' : 'court-card--inactive'}`}>
              <button className="court-card__edit-trigger" onClick={() => setEditingCourt(court)}>
                <div className="court-card__header">
                  <h3>{court.name}</h3>
                  {!court.active && <span className="court-card__badge">Inativa</span>}
                </div>
                <p className="court-card__meta">
                  {sportLabel(court.sport)} · {surfaceLabel(court.surfaceType)}
                  {court.hasLighting ? ' · Com iluminação' : ''}
                </p>
                <p className="court-card__prices">
                  {court.priceRules.length === 0
                    ? 'Sem preços configurados'
                    : `${court.priceRules.length} horário(s) com preço definido`}
                </p>
              </button>
              <Link to={`/painel/quadras/${court.id}/agenda`} className="court-card__agenda-link">
                Ver agenda →
              </Link>
            </div>
          ))}
        </div>
      )}

      {(isCreating || editingCourt) && (
        <CourtFormModal
          court={editingCourt}
          onClose={closeModal}
          onSaved={handleSaved}
          onSessionExpired={onSessionExpired}
        />
      )}
    </div>
  )
}
