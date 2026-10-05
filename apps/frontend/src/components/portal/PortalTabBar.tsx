import { NavLink } from 'react-router-dom'
import './PortalTabBar.css'

interface PortalTabBarProps {
  homeHref: string | null
  chatOpen: boolean
  onToggleChat: () => void
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5.5H9V20H5a1 1 0 0 1-1-1v-7.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A1.5 1.5 0 0 1 4 14.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M8.5 9.5h7M8.5 12.5h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function BookingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 10h16M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 15l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function PortalTabBar({ homeHref, chatOpen, onToggleChat }: PortalTabBarProps) {
  return (
    <nav className="portal-tabs" aria-label="Navegação principal">
      {homeHref && (
        <NavLink
          to={homeHref}
          end
          className={({ isActive }) => `portal-tabs__item${isActive && !chatOpen ? ' portal-tabs__item--active' : ''}`}
        >
          <HomeIcon />
          <span>Início</span>
        </NavLink>
      )}
      <button
        type="button"
        className={`portal-tabs__item${chatOpen ? ' portal-tabs__item--active' : ''}`}
        aria-pressed={chatOpen}
        onClick={onToggleChat}
      >
        <ChatIcon />
        <span>Assistente</span>
      </button>
      <NavLink
        to="/minhas-reservas"
        className={({ isActive }) => `portal-tabs__item${isActive && !chatOpen ? ' portal-tabs__item--active' : ''}`}
      >
        <BookingsIcon />
        <span>Minhas reservas</span>
      </NavLink>
    </nav>
  )
}
