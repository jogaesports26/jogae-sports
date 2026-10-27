import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { usePainelContext } from './PainelLayout'
import { SessionExpiredError } from '../../lib/api'
import { fetchCourt, fetchCourts, SPORT_OPTIONS, SURFACE_OPTIONS } from '../../lib/courts'
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
  { to: 'agenda', label: 'Agenda', ownerOnly: false },
  { to: 'precos', label: 'Preços & disponibilidade', ownerOnly: true },
  { to: 'fila-de-espera', label: 'Fila de espera', ownerOnly: false },
  { to: 'manutencao', label: 'Manutenção', ownerOnly: false },
]

export default function CourtDetailLayout() {
  const { courtId } = useParams<{ courtId: string }>()
  const { user, onSessionExpired } = usePainelContext()
  const tabs = TABS.filter((tab) => !tab.ownerOnly || user.role !== 'STAFF')
  const [court, setCourt] = useState<Court | null>(null)
  const [error, setError] = useState('')
  const [allCourts, setAllCourts] = useState<Court[]>([])
  const navigate = useNavigate()
  const location = useLocation()

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

  // O seletor de quadra é um extra: se a lista falhar, a tela segue sem ele.
  useEffect(() => {
    fetchCourts().then(setAllCourts).catch(() => setAllCourts([]))
  }, [])

  // Trocar de quadra mantém a aba em que a pessoa está (agenda, preços, fila, manutenção).
  function switchCourt(id: string) {
    const tab = location.pathname.split('/').pop() || 'agenda'
    navigate(`/painel/quadras/${id}/${tab}`)
  }

  if (error) return <p className="court-detail__error">{error}</p>
  if (!court) return <p className="court-detail__loading">Carregando quadra...</p>

  return (
    <div className="court-detail">
      <div className="court-detail__topline">
        <Link to="/painel/quadras" className="court-detail__back">
          ← Quadras
        </Link>
        {allCourts.length > 1 && (
          <label className="court-detail__switch">
            <span>Trocar de quadra</span>
            <select className="input" value={court.id} onChange={(event) => switchCourt(event.target.value)}>
              {allCourts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item.active ? '' : ' (inativa)'}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="court-detail__header">
        <h1>{court.name}</h1>
        <p className="court-detail__meta">
          {sportLabel(court.sport)} · {surfaceLabel(court.surfaceType)}
          {court.hasLighting ? ' · Com iluminação' : ''}
        </p>
      </div>

      <nav className="tabs">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `tab ${isActive ? 'tab--active' : ''}`}
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
