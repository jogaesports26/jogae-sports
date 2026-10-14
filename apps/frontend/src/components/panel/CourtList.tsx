import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SessionExpiredError } from '../../lib/api'
import { fetchCourts, SPORT_OPTIONS, SURFACE_OPTIONS } from '../../lib/courts'
import { fetchCourtsWeekSummary } from '../../lib/reservations'
import type { CourtWeekSummary } from '../../lib/reservations'
import type { Court } from '../../lib/courts'
import SportIcon from '../SportIcon'
import CourtFormModal from './CourtFormModal'
import './CourtList.css'

const sportLabel = (value: string) => SPORT_OPTIONS.find((option) => option.value === value)?.label ?? value
const surfaceLabel = (value: string) =>
  SURFACE_OPTIONS.find((option) => option.value === value)?.label ?? value

function priceRange(court: Court) {
  const prices = court.priceRules.map((rule) => Number(rule.pricePerHour)).filter((price) => !Number.isNaN(price))
  if (prices.length === 0) return null
  const format = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return min === max ? `${format(min)}/h` : `${format(min)} a ${format(max)}/h`
}

interface CourtListProps {
  onSessionExpired: () => void
}

export default function CourtList({ onSessionExpired }: CourtListProps) {
  const [courts, setCourts] = useState<Court[] | null>(null)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState<Map<string, CourtWeekSummary>>(new Map())
  const [editingCourt, setEditingCourt] = useState<Court | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  async function load() {
    // O resumo da semana é um extra: se falhar, os cards aparecem sem ele.
    fetchCourtsWeekSummary()
      .then((list) => setSummary(new Map(list.map((item) => [item.courtId, item]))))
      .catch(() => setSummary(new Map()))
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
          {courts.map((court) => {
            const week = summary.get(court.id)
            const percent = week ? Math.round(week.occupancyRate * 100) : null
            return (
              <div key={court.id} className={`court-card ${court.active ? '' : 'court-card--inactive'}`}>
                <div className="court-card__header">
                  <span className="court-card__icon" aria-hidden="true">
                    <SportIcon sport={court.sport} />
                  </span>
                  <h3>
                    {/* O card inteiro leva à agenda: o link se estende por cima de tudo (o botão Editar fica por cima dele). */}
                    <Link to={`/painel/quadras/${court.id}/agenda`} className="court-card__link">
                      {court.name}
                    </Link>
                  </h3>
                  {!court.active && <span className="pill pill--neutral">Inativa</span>}
                </div>
                <p className="court-card__meta">
                  {sportLabel(court.sport)} · {surfaceLabel(court.surfaceType)}
                  {court.hasLighting ? ' · Com iluminação' : ''}
                </p>
                <p className="court-card__prices">{priceRange(court) ?? 'Sem preços configurados'}</p>
                {court.priceRules.length === 0 && (
                  <p className="court-card__hint">Defina os preços para a quadra aparecer na lojinha.</p>
                )}
                {week && court.priceRules.length > 0 && (
                  <div className="court-card__week">
                    <p>
                      <strong>{week.reservationsCount}</strong> {week.reservationsCount === 1 ? 'reserva' : 'reservas'} nos próximos 7 dias ·{' '}
                      <strong>{percent}%</strong> ocupada
                    </p>
                    <span className="court-card__bar" role="img" aria-label={`${percent}% dos horários ocupados`}>
                      <span style={{ width: `${percent}%` }} />
                    </span>
                  </div>
                )}
                <div className="court-card__footer">
                  <span className="court-card__agenda-hint">Ver agenda →</span>
                  <button type="button" className="court-card__edit" onClick={() => setEditingCourt(court)}>
                    Editar
                  </button>
                </div>
              </div>
            )
          })}
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
