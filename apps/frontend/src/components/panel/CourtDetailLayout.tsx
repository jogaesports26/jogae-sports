import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useOutletContext, useParams } from 'react-router-dom'
import { usePainelContext } from './PainelLayout'
import { SessionExpiredError } from '../../lib/api'
import { fetchCourt, SPORT_OPTIONS, SURFACE_OPTIONS } from '../../lib/courts'
import type { Court } from '../../lib/courts'
import './CourtDetailLayout.css'

export interface CourtDetailContext {
  court: Court
  reloadCourt: () => void
  onSessionExpired: () => void
}

export function useCourtDetailContext() {
  return useOutletContext<CourtDetailContext>()
}

const sportLabel = (value: string) => SPORT_OPTIONS.find((option) => option.value === value)?.label ?? value
const surfaceLabel = (value: string) =>
  SURFACE_OPTIONS.find((option) => option.value === value)?.label ?? value

const TABS = [
  { to: 'agenda', label: 'Agenda' },
  { to: 'precos', label: 'Preços & disponibilidade' },
  { to: 'fila-de-espera', label: 'Fila de espera' },
  { to: 'manutencao', label: 'Manutenção' },
]

export default function CourtDetailLayout() {
  const { courtId } = useParams<{ courtId: string }>()
  const { onSessionExpired } = usePainelContext()
  const [court, setCourt] = useState<Court | null>(null)
  const [error, setError] = useState('')

  function load() {
    if (!courtId) return
    fetchCourt(courtId)
      .then(setCourt)
      .catch((err) => {
        if (err instanceof SessionExpiredError) {
          onSessionExpired()
          return
        }
        setError(err instanceof Error ? err.message : 'Erro ao carregar a quadra')
      })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courtId])

  if (error) return <p className="court-detail__error">{error}</p>
  if (!court) return <p className="court-detail__loading">Carregando quadra...</p>

  return (
    <div className="court-detail">
      <Link to="/painel/quadras" className="court-detail__back">
        ← Voltar pras quadras
      </Link>

      <div className="court-detail__header">
        <h1>{court.name}</h1>
        <p className="court-detail__meta">
          {sportLabel(court.sport)} · {surfaceLabel(court.surfaceType)}
          {court.hasLighting ? ' · Com iluminação' : ''}
        </p>
      </div>

      <nav className="court-detail__tabs">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `court-detail__tab ${isActive ? 'court-detail__tab--active' : ''}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <div className="court-detail__content">
        <Outlet context={{ court, reloadCourt: load, onSessionExpired } satisfies CourtDetailContext} />
      </div>
    </div>
  )
}
