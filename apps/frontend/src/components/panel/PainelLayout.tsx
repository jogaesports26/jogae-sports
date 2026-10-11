import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import type { AuthUser } from '../../lib/api'
import { clearSession } from '../../lib/api'
import { fetchTodayReservations } from '../../lib/reservations'
import './PainelLayout.css'
import './panel-kit.css'
import './config-kit.css'

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

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconCollapse() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9.5 4.5v15" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H9M14 8l4 4-4 4M18 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

interface NavItem {
  to: string
  label: string
  Icon: () => ReactElement
  /** Caminhos que também deixam este item ativo (telas que moram dentro da área). */
  also?: string[]
  ownerOnly: boolean
  end?: boolean
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Dia a dia',
    items: [
      { to: '/painel', label: 'Hoje', Icon: IconOverview, end: true, ownerOnly: false },
      { to: '/painel/quadras', label: 'Quadras', Icon: IconCourts, ownerOnly: false },
      { to: '/painel/clientes', label: 'Clientes', Icon: IconCustomers, also: ['/painel/avaliacoes'], ownerOnly: true },
    ],
  },
  {
    label: 'Negócio',
    items: [
      { to: '/painel/relatorios', label: 'Financeiro', Icon: IconReports, ownerOnly: true },
      {
        to: '/painel/configuracoes',
        label: 'Configurar',
        Icon: IconSettings,
        also: ['/painel/equipe', '/painel/cupons', '/painel/equipamentos'],
        ownerOnly: true,
      },
    ],
  },
]

/** Abas das telas que moram dentro de uma área (aparecem no topo do conteúdo). */
const AREA_TABS: { prefixes: string[]; tabs: { to: string; label: string }[] }[] = [
  {
    prefixes: ['/painel/clientes', '/painel/avaliacoes'],
    tabs: [
      { to: '/painel/clientes', label: 'Clientes' },
      { to: '/painel/avaliacoes', label: 'Avaliações' },
    ],
  },
]

/** Área Configurar: telas que moram dentro dela e o menu de seções à esquerda. */
const CONFIG_PREFIXES = ['/painel/configuracoes', '/painel/equipe', '/painel/cupons', '/painel/equipamentos']

const CONFIG_NAV: { to: string; label: string; aba?: string; path: string }[] = [
  { to: '/painel/configuracoes', label: 'Arena', path: '/painel/configuracoes' },
  { to: '/painel/configuracoes?aba=lojinha', label: 'Lojinha pública', aba: 'lojinha', path: '/painel/configuracoes' },
  { to: '/painel/configuracoes?aba=aparencia', label: 'Aparência', aba: 'aparencia', path: '/painel/configuracoes' },
  { to: '/painel/configuracoes?aba=precos', label: 'Preços', aba: 'precos', path: '/painel/configuracoes' },
  { to: '/painel/configuracoes?aba=metas', label: 'Metas', aba: 'metas', path: '/painel/configuracoes' },
  { to: '/painel/equipe', label: 'Equipe', path: '/painel/equipe' },
  { to: '/painel/cupons', label: 'Cupons', path: '/painel/cupons' },
  { to: '/painel/equipamentos', label: 'Equipamentos', path: '/painel/equipamentos' },
]

const COLLAPSED_KEY = 'jogae_painel_collapsed'

function isItemActive(pathname: string, item: NavItem) {
  if (item.end) return pathname === item.to
  return [item.to, ...(item.also ?? [])].some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

export default function PainelLayout() {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [todayCount, setTodayCount] = useState<number | null>(null)
  const drawerRef = useRef<HTMLDialogElement | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('jogae_user')
    const token = localStorage.getItem('jogae_token')

    if (!raw || !token) {
      navigate('/login')
      return
    }

    setUser(JSON.parse(raw))
  }, [navigate])

  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => {
      const next = !current
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0')
      } catch {
        // sem armazenamento: o estado só vale nesta visita
      }
      return next
    })
  }, [])

  // Ctrl+B (ou Cmd+B) recolhe e abre a barra lateral, fora de campos de texto.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'b') return
      const target = event.target as HTMLElement | null
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return
      event.preventDefault()
      toggleCollapsed()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleCollapsed])

  // Gaveta do celular: o <dialog> nativo já cuida do foco, do Esc e do fundo.
  useEffect(() => {
    const dialog = drawerRef.current
    if (!dialog) return
    if (drawerOpen && !dialog.open) dialog.showModal()
    if (!drawerOpen && dialog.open) dialog.close()
  }, [drawerOpen])

  // Selo do menu: quantas reservas de hoje ainda vão acontecer.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    async function loadCount() {
      try {
        const reservations = await fetchTodayReservations()
        if (cancelled) return
        const now = Date.now()
        setTodayCount(reservations.filter((r) => r.status === 'CONFIRMED' && new Date(r.endsAt).getTime() > now).length)
      } catch {
        // o selo é um extra: se falhar, simplesmente não aparece
      }
    }
    loadCount()
    const id = setInterval(loadCount, 120_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [user, pathname])

  function handleLogout() {
    clearSession()
    navigate('/')
  }

  function handleSessionExpired() {
    navigate('/login')
  }

  if (!user) return null

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.ownerOnly || user.role !== 'STAFF'),
  })).filter((group) => group.items.length > 0)

  const isConfigArea = CONFIG_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  const currentAba = new URLSearchParams(search).get('aba')
  const isConfigNavActive = (item: (typeof CONFIG_NAV)[number]) => {
    if (item.path === '/painel/configuracoes') {
      return pathname === '/painel/configuracoes' && (item.aba ?? null) === (CONFIG_NAV.some((n) => n.aba === currentAba) ? currentAba : null)
    }
    return pathname === item.path || pathname.startsWith(`${item.path}/`)
  }
  const areaTabs = AREA_TABS.find((area) => area.prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)))

  const renderNav = (collapsedMode: boolean) => (
    <nav className="painel__nav" aria-label="Principal">
      {groups.map((group) => (
        <div className="painel__group" key={group.label}>
          <p className="painel__group-label">{group.label}</p>
          {group.items.map((item) => {
            const active = isItemActive(pathname, item)
            const badge = item.to === '/painel' && todayCount ? todayCount : null
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={collapsedMode ? item.label : undefined}
                aria-label={collapsedMode ? item.label : undefined}
                aria-current={active ? 'page' : undefined}
                onClick={() => setDrawerOpen(false)}
                className={`painel__nav-link ${active ? 'painel__nav-link--active' : ''}`}
              >
                <item.Icon />
                <span className="painel__nav-text">{item.label}</span>
                {badge !== null && (
                  <span className="painel__badge" aria-label={`${badge} reservas hoje`}>
                    {badge}
                  </span>
                )}
              </NavLink>
            )
          })}
        </div>
      ))}
    </nav>
  )

  const userBlock = (
    <div className="painel__user">
      <span className="painel__avatar" aria-hidden="true">
        {user.name.trim().charAt(0).toUpperCase()}
      </span>
      <span className="painel__user-text">
        <strong>{user.name}</strong>
        <span>{user.role === 'STAFF' ? 'Funcionário' : 'Gestor'}</span>
      </span>
    </div>
  )

  return (
    <div className={`painel${collapsed ? ' painel--collapsed' : ''}`}>
      <aside className="painel__sidebar">
        <span className="painel__brand">
          Jogaê <small>Gestão</small>
        </span>
        {renderNav(collapsed)}
        {userBlock}
        <button className="painel__logout" onClick={handleLogout} title={collapsed ? 'Sair' : undefined} aria-label="Sair">
          <IconLogout />
          <span className="painel__nav-text">Sair</span>
        </button>
      </aside>

      <dialog
        ref={drawerRef}
        className="painel__drawer"
        aria-label="Menu"
        onClose={() => setDrawerOpen(false)}
        onClick={(event) => {
          if (event.target === drawerRef.current) setDrawerOpen(false)
        }}
      >
        <div className="painel__drawer-inner">
          <span className="painel__brand">
            Jogaê <small>Gestão</small>
          </span>
          {renderNav(false)}
          {userBlock}
          <button className="painel__logout" onClick={handleLogout}>
            <IconLogout />
            <span className="painel__nav-text">Sair</span>
          </button>
        </div>
      </dialog>

      <div className="painel__main">
        <div className="painel__topbar">
          <button
            type="button"
            className="painel__icon-button painel__icon-button--desktop"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Abrir o menu lateral' : 'Recolher o menu lateral'}
            aria-pressed={collapsed}
            title="Recolher ou abrir o menu (Ctrl+B)"
          >
            <IconCollapse />
          </button>
          <button
            type="button"
            className="painel__icon-button painel__icon-button--mobile"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir o menu"
          >
            <IconMenu />
          </button>
          <span className="painel__topbar-brand">Jogaê</span>
        </div>

        <div className="painel__content">
          {areaTabs && (
            <nav className="segmented painel__area-tabs" aria-label="Seções da área">
              {areaTabs.tabs.map((tab) => {
                const active = pathname === tab.to || pathname.startsWith(`${tab.to}/`)
                return (
                  <NavLink
                    key={tab.to}
                    to={tab.to}
                    aria-current={active ? 'page' : undefined}
                    className={`segmented__item${active ? ' segmented__item--active' : ''}`}
                  >
                    {tab.label}
                  </NavLink>
                )
              })}
            </nav>
          )}
          {isConfigArea ? (
            <div className="config-area">
              <nav className="config-nav" aria-label="Seções do Configurar">
                <p className="config-nav__title">Configurar</p>
                {CONFIG_NAV.map((item) => (
                  <Link key={item.to} to={item.to} aria-current={isConfigNavActive(item) ? 'page' : undefined}>
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="config-area__content">
                <Outlet context={{ user, onSessionExpired: handleSessionExpired } satisfies PainelContext} />
              </div>
            </div>
          ) : (
            <Outlet context={{ user, onSessionExpired: handleSessionExpired } satisfies PainelContext} />
          )}
        </div>
      </div>
    </div>
  )
}
