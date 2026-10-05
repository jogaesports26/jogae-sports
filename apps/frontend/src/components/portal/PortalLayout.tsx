import { useEffect, useState } from 'react'
import { Link, Outlet, useMatch, useParams } from 'react-router-dom'
import { clearPlayerSession, getPlayerUser } from '../../lib/player'
import { formatPhone } from '../../lib/phone'
import ChatWidget from './ChatWidget'
import PortalTabBar from './PortalTabBar'
import './PortalLayout.css'

const LAST_SLUG_KEY = 'jogae_last_slug'

function readLastSlug() {
  try {
    return localStorage.getItem(LAST_SLUG_KEY)
  } catch {
    return null
  }
}

export default function PortalLayout() {
  const player = getPlayerUser()
  const { slug } = useParams<{ slug?: string }>()
  const isCourtPage = Boolean(useMatch('/:slug/:courtId'))
  const [chatOpen, setChatOpen] = useState(false)

  useEffect(() => {
    if (!slug) return
    try {
      localStorage.setItem(LAST_SLUG_KEY, slug)
    } catch {
      // sem localStorage, o "Início" da barra some em Minhas reservas — não quebra nada
    }
  }, [slug])

  // A tela da quadra já tem a barra fixa de reserva embaixo, então não mostra a barra de abas nela.
  const showTabs = !isCourtPage
  const homeSlug = slug ?? readLastSlug()

  function handleLogout() {
    clearPlayerSession()
    window.location.reload()
  }

  return (
    <div className={`portal${showTabs ? ' portal--tabbed' : ''}`}>
      <header className="portal__nav">
        {slug ? (
          <Link to={`/${slug}`} className="portal__logo">
            Jogaê Sports
          </Link>
        ) : (
          <span className="portal__logo">Jogaê Sports</span>
        )}
        <nav className="portal__nav-links">
          {!showTabs && (
            <button
              type="button"
              className="portal__chat-button"
              aria-label="Abrir assistente"
              aria-pressed={chatOpen}
              onClick={() => setChatOpen((open) => !open)}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A1.5 1.5 0 0 1 4 14.5v-9Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path d="M8.5 9.5h7M8.5 12.5h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          )}
          {player ? (
            <>
              <Link to="/minhas-reservas">Minhas reservas</Link>
              <span className="portal__player-name">{player.name ?? formatPhone(player.phone)}</span>
              <button className="portal__logout" onClick={handleLogout}>
                Sair
              </button>
            </>
          ) : (
            <Link to="/minhas-reservas" className="portal__login-link">
              Entrar
            </Link>
          )}
        </nav>
      </header>

      <main className="portal__content">
        <Outlet context={{ basePath: slug ? `/${slug}` : '' }} />
      </main>

      <ChatWidget open={chatOpen} onOpenChange={setChatOpen} tabbed={showTabs} hideToggleOnMobile={!showTabs} />

      {showTabs && (
        <PortalTabBar
          homeHref={homeSlug ? `/${homeSlug}` : null}
          chatOpen={chatOpen}
          onToggleChat={() => setChatOpen((open) => !open)}
        />
      )}
    </div>
  )
}
