import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate, useOutletContext } from 'react-router-dom'
import type { AuthUser } from '../../lib/api'
import { clearSession } from '../../lib/api'
import './PainelLayout.css'

export interface PainelContext {
  user: AuthUser
  onSessionExpired: () => void
}

export function usePainelContext() {
  return useOutletContext<PainelContext>()
}

function IconOverview() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function IconCourts() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 4v16M3 12h18" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function IconReports() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 20V10M12 20V4M20 20v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconCustomers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15.5 4.3c1.7.5 3 2.2 3 4.2s-1.3 3.7-3 4.2M19 20c0-2.7-1.7-5-4-5.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconTeam() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M2.5 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14.5 14.3c2.6.3 4.5 2.6 4.5 5.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconCoupon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 9.5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1.2a1.6 1.6 0 0 0 0 2.6v1.2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1.2a1.6 1.6 0 0 0 0-2.6V9.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M9.5 7.5v9" stroke="currentColor" strokeWidth="1.8" strokeDasharray="1.6 1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconEquipment() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="7" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10.2 12h3.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconStaff() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="10.5" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 15.5c.6-1.6 2-2.5 4-2.5s3.4.9 4 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconReviews() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9 2.6-5.3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

const NAV_ITEMS = [
  { to: '/painel', label: 'Visão geral', Icon: IconOverview, end: true, ownerOnly: false },
  { to: '/painel/quadras', label: 'Quadras', Icon: IconCourts, end: false, ownerOnly: false },
  { to: '/painel/relatorios', label: 'Relatórios', Icon: IconReports, end: false, ownerOnly: true },
  { to: '/painel/clientes', label: 'Clientes', Icon: IconCustomers, end: false, ownerOnly: true },
  { to: '/painel/equipe', label: 'Equipe', Icon: IconTeam, end: false, ownerOnly: true },
  { to: '/painel/cupons', label: 'Cupons', Icon: IconCoupon, end: false, ownerOnly: true },
  { to: '/painel/equipamentos', label: 'Equipamentos', Icon: IconEquipment, end: false, ownerOnly: true },
  { to: '/painel/avaliacoes', label: 'Avaliações', Icon: IconReviews, end: false, ownerOnly: true },
  { to: '/painel/funcionarios', label: 'Funcionários', Icon: IconStaff, end: false, ownerOnly: true },
  { to: '/painel/configuracoes', label: 'Configurações', Icon: IconSettings, end: false, ownerOnly: true },
]

export default function PainelLayout() {
  const navigate = useNavigate()
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('jogae_user')
    const token = localStorage.getItem('jogae_token')

    if (!raw || !token) {
      navigate('/login')
      return
    }

    setUser(JSON.parse(raw))
  }, [navigate])

  function handleLogout() {
    clearSession()
    navigate('/')
  }

  function handleSessionExpired() {
    navigate('/login')
  }

  if (!user) return null

  const navItems = NAV_ITEMS.filter((item) => !item.ownerOnly || user.role !== 'STAFF')

  return (
    <div className="painel">
      <aside className="painel__sidebar">
        <span className="painel__brand">Jogaê Sports</span>

        <nav className="painel__nav">
          {navItems.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `painel__nav-link ${isActive ? 'painel__nav-link--active' : ''}`}
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="painel__logout" onClick={handleLogout}>
          Sair
        </button>
      </aside>

      <div className="painel__main">
        <Outlet context={{ user, onSessionExpired: handleSessionExpired } satisfies PainelContext} />
      </div>
    </div>
  )
}
