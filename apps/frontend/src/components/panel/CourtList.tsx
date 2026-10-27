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
  const [showInactive, setShowInactive] = useState(false)

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

  const inactiveCount = courts.filter((court) => !court.active).length
  const visible = showInactive ? courts : courts.filter((court) => court.active)

  return (
    <div className="court-list">
      <div className="court-list__toolbar">
        <p className="court-list__count">
          {courts.length - inactiveCount} {courts.length - inactiveCount === 1 ? 'quadra ativa' : 'quadras ativas'}
          {inactiveCount > 0 && (
            <>
              {' · '}
              <button type="button" className="court-list__toggle" onClick={() => setShowInactive((value) => !value)} aria-pressed={showInactive}>
                {showInactive ? 'Esconder' : 'Mostrar'} {inactiveCount} {inactiveCount === 1 ? 'inativa' : 'inativas'}
              </button>
            </>
          )}
        </p>
        <button className="court-list__new-button" onClick={() => setIsCreating(true)}>
          Nova quadra
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
          {visible.map((court) => {
            const week = summary.get(court.id)
            const percent = week ? Math.round(week.occupancyRate * 100) : null
            const cover = court.photoUrls[0]
            return (
              <article key={court.id} className={`court-card ${court.active ? '' : 'court-card--inactive'}`}>
                <div className="court-card__cover">
                  {cover ? (
                    <img src={cover} alt="" loading="lazy" />
                  ) : (
                    <span className="court-card__icon" aria-hidden="true">
                      <SportIcon sport={court.sport} />
                    </span>
                  )}
                </div>

                <div className="court-card__body">
                  <div className="court-card__header">
                    <h3>
                      {/* O card inteiro leva à agenda: o link se estende por cima de tudo (os botões do rodapé ficam por cima dele). */}
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

                  {court.priceRules.length === 0 ? (
                    <p className="court-card__hint">Sem preços: defina para a quadra aparecer na lojinha.</p>
                  ) : (
                    <p className="court-card__prices">{priceRange(court)}</p>
                  )}

                  {week && court.priceRules.length > 0 && (
                    <div className="court-card__week">
                      <span className="court-card__bar" role="img" aria-label={`${percent}% dos horários ocupados`}>
                        <span style={{ width: `${percent}%` }} />
                      </span>
                      <p>
                        {week.reservationsCount} {week.reservationsCount === 1 ? 'reserva' : 'reservas'} em 7 dias · {percent}% ocupada
                      </p>
                    </div>
                  )}

                  <div className="court-card__footer">
                    <Link to={`/painel/quadras/${court.id}/precos`} className="court-card__action">
                      Preços
                    </Link>
                    <button type="button" className="court-card__action" onClick={() => setEditingCourt(court)}>
                      Editar
                    </button>
                  </div>
                </div>
              </article>
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
