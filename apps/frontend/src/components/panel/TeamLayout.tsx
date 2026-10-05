import { NavLink, Outlet } from 'react-router-dom'
import { usePainelContext } from './PainelLayout'
import './TeamLayout.css'

const TABS = [
  { to: 'instrutores', label: 'Instrutores' },
  { to: 'acesso', label: 'Acesso ao painel' },
]

export default function TeamLayout() {
  const context = usePainelContext()

  return (
    <div className="team">
      <h1>Equipe</h1>
      <p className="team__subtitle">
        Quem trabalha na sua arena: instrutores que você associa às reservas e funcionários que entram no painel com login próprio.
      </p>

      <nav className="tabs">
        {TABS.map((tab) => (
          <NavLink key={tab.to} to={tab.to} className={({ isActive }) => `tab ${isActive ? 'tab--active' : ''}`}>
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet context={context} />
    </div>
  )
}
