import { Link, Outlet } from 'react-router-dom'
import { clearPlayerSession, getPlayerUser } from '../../lib/player'
import './PortalLayout.css'

export default function PortalLayout() {
  const player = getPlayerUser()

  function handleLogout() {
    clearPlayerSession()
    window.location.href = '/reservar'
  }

  return (
    <div className="portal">
      <header className="portal__nav">
        <Link to="/reservar" className="portal__logo">
          Jogaê Sports
        </Link>
        <nav className="portal__nav-links">
          <Link to="/reservar">Quadras</Link>
          <Link to="/minhas-reservas">Minhas reservas</Link>
          {player ? (
            <button className="portal__logout" onClick={handleLogout}>
              Sair ({player.name ?? player.phone})
            </button>
          ) : null}
        </nav>
      </header>

      <main className="portal__content">
        <Outlet />
      </main>
    </div>
  )
}
