import { Link, Outlet, useParams } from 'react-router-dom'
import { clearPlayerSession, getPlayerUser } from '../../lib/player'
import { formatPhone } from '../../lib/phone'
import ChatWidget from './ChatWidget'
import './PortalLayout.css'

export default function PortalLayout() {
  const player = getPlayerUser()
  const { slug } = useParams<{ slug?: string }>()

  function handleLogout() {
    clearPlayerSession()
    window.location.reload()
  }

  return (
    <div className="portal">
      <header className="portal__nav">
        {slug ? (
          <Link to={`/${slug}`} className="portal__logo">
            Jogaê Sports
          </Link>
        ) : (
          <span className="portal__logo">Jogaê Sports</span>
        )}
        <nav className="portal__nav-links">
          {player && <Link to="/minhas-reservas">Minhas reservas</Link>}
          {player && (
            <>
              <span className="portal__player-name">{player.name ?? formatPhone(player.phone)}</span>
              <button className="portal__logout" onClick={handleLogout}>
                Sair
              </button>
            </>
          )}
        </nav>
      </header>

      <main className="portal__content">
        <Outlet context={{ basePath: slug ? `/${slug}` : '' }} />
      </main>

      <ChatWidget />
    </div>
  )
}
