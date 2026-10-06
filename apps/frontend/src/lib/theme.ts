import { useEffect, useState } from 'react'
import { API_URL } from './api'

/** Tema resolvido de uma lojinha (vem de GET /public/estabelecimentos/:slug/theme). */
export interface StoreTheme {
  rev: number
  name: string | null
  description: string | null
  coverUrl: string | null
  logoUrl: string | null
  themeColor: string
  cssVars: Record<string, string>
  /** Sobrescritas de marca no modo escuro (derivadas no backend). */
  cssVarsDark?: Record<string, string>
}

declare global {
  interface Window {
    /** Injetado no HTML inicial pelo Edge Middleware (middleware.ts) pra evitar o flash de tema errado. */
    __JOGAE_THEME__?: { slug: string; theme: StoreTheme }
  }
}

const CACHE_PREFIX = 'jogae_theme_'

function readCache(slug: string): StoreTheme | null {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + slug)
    return raw ? (JSON.parse(raw) as StoreTheme) : null
  } catch {
    return null
  }
}

function writeCache(slug: string, theme: StoreTheme) {
  try {
    sessionStorage.setItem(CACHE_PREFIX + slug, JSON.stringify(theme))
  } catch {
    // sem sessionStorage só perde o atalho de primeira pintura
  }
}

export async function fetchStoreTheme(slug: string, query = ''): Promise<StoreTheme | null> {
  const suffix = query ? `?${query}` : ''
  const response = await fetch(`${API_URL}/public/estabelecimentos/${encodeURIComponent(slug)}/theme${suffix}`)
  if (!response.ok) return null
  return response.json()
}

function initialTheme(slug: string | null): StoreTheme | null {
  if (!slug) return null
  const injected = window.__JOGAE_THEME__
  if (injected?.slug === slug) return injected.theme
  return readCache(slug)
}

/**
 * Carrega o tema da lojinha e aplica as variáveis CSS no <html> enquanto a rota
 * da lojinha estiver montada (modais renderizados fora do wrapper herdam também).
 * Nunca é usado no painel do dono. Sem slug ou sem tema → mantém o padrão Jogaê.
 */
export function useStoreTheme(
  slug: string | null | undefined,
  { enabled = true, query = '', scheme = 'light' }: { enabled?: boolean; query?: string; scheme?: ColorScheme } = {},
): StoreTheme | null {
  const key = enabled ? (slug ?? null) : null
  // Com parâmetros (embed) o tema é calculado no servidor pra essa combinação; não usa o atalho de cache/injeção.
  const [theme, setTheme] = useState<StoreTheme | null>(() => (query ? null : initialTheme(key)))

  useEffect(() => {
    if (!key) return
    let cancelled = false
    fetchStoreTheme(key, query)
      .then((fresh) => {
        if (cancelled || !fresh) return
        if (!query) writeCache(key, fresh)
        setTheme(fresh)
      })
      .catch(() => {
        // offline/erro: segue com o tema em cache ou o padrão
      })
    return () => {
      cancelled = true
    }
  }, [key, query])

  useEffect(() => {
    if (!theme || !key) return
    const root = document.documentElement
    // No escuro, a marca derivada no backend sobrescreve a do claro; neutros vêm de tokens.css ([data-theme='dark']).
    const vars = scheme === 'dark' ? { ...theme.cssVars, ...theme.cssVarsDark } : theme.cssVars
    const names = Object.keys(vars)
    names.forEach((name) => root.style.setProperty(name, vars[name]))

    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    const previousColor = meta?.content
    if (meta) meta.content = theme.themeColor

    return () => {
      names.forEach((name) => root.style.removeProperty(name))
      if (meta && previousColor !== undefined) meta.content = previousColor
    }
  }, [theme, key, scheme])

  return key ? theme : null
}

export type ColorScheme = 'light' | 'dark'
const SCHEME_KEY = 'jogae_color_scheme'

function readSchemePreference(): ColorScheme | null {
  try {
    const value = localStorage.getItem(SCHEME_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

/**
 * Modo claro/escuro da lojinha. Segue o sistema até a pessoa escolher no botão do topo;
 * a escolha fica salva neste aparelho. Marca <html data-theme="dark"> só enquanto a rota da lojinha estiver montada.
 */
export function useColorScheme() {
  const [preference, setPreference] = useState<ColorScheme | null>(() => readSchemePreference())
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const scheme: ColorScheme = preference ?? (systemDark ? 'dark' : 'light')

  useEffect(() => {
    const root = document.documentElement
    if (scheme === 'dark') root.dataset.theme = 'dark'
    return () => {
      delete root.dataset.theme
    }
  }, [scheme])

  function toggle() {
    const next: ColorScheme = scheme === 'dark' ? 'light' : 'dark'
    setPreference(next)
    try {
      localStorage.setItem(SCHEME_KEY, next)
    } catch {
      // sem localStorage, a escolha vale só até recarregar
    }
  }

  return { scheme, toggle }
}

/** Escolhas do dono (o que ele edita). A derivação completa é feita no backend. */
export interface ThemeInput {
  preset?: string
  primary?: string
  action?: string
  radius?: 'sm' | 'md' | 'lg'
  font?: 'inter' | 'system' | 'serif'
  logoUrl?: string
  coverUrl?: string
}

export interface ResolvedTheme {
  cssVars: Record<string, string>
  themeColor: string
  warnings: string[]
  adjustments: string[]
}

export interface StoredTheme extends ThemeInput {
  version: number
  rev: number
  resolved: ResolvedTheme
  history: ThemeInput[]
}

/** Mesmos presets do backend (theme.util.ts); só pra mostrar as amostras de cor na escolha. */
export const THEME_PRESET_OPTIONS = [
  { key: 'jogae', label: 'Jogaê', swatch: ['var(--swatch-jogae-a)', 'var(--swatch-jogae-b)'] },
  { key: 'quadra', label: 'Quadra', swatch: ['var(--swatch-quadra-a)', 'var(--swatch-quadra-b)'] },
  { key: 'areia', label: 'Areia', swatch: ['var(--swatch-areia-a)', 'var(--swatch-areia-b)'] },
  { key: 'noite', label: 'Noite', swatch: ['var(--swatch-noite-a)', 'var(--swatch-noite-b)'] },
  { key: 'classico', label: 'Clássico', swatch: ['var(--swatch-classico-a)', 'var(--swatch-classico-b)'] },
] as const
