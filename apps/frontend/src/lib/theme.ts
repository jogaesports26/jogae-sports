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

export async function fetchStoreTheme(slug: string): Promise<StoreTheme | null> {
  const response = await fetch(`${API_URL}/public/estabelecimentos/${encodeURIComponent(slug)}/theme`)
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
export function useStoreTheme(slug: string | null | undefined): StoreTheme | null {
  const key = slug ?? null
  const [theme, setTheme] = useState<StoreTheme | null>(() => initialTheme(key))

  useEffect(() => {
    if (!key) return
    let cancelled = false
    fetchStoreTheme(key)
      .then((fresh) => {
        if (cancelled || !fresh) return
        writeCache(key, fresh)
        setTheme(fresh)
      })
      .catch(() => {
        // offline/erro: segue com o tema em cache ou o padrão
      })
    return () => {
      cancelled = true
    }
  }, [key])

  useEffect(() => {
    if (!theme) return
    const root = document.documentElement
    const names = Object.keys(theme.cssVars)
    names.forEach((name) => root.style.setProperty(name, theme.cssVars[name]))

    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    const previousColor = meta?.content
    if (meta) meta.content = theme.themeColor

    return () => {
      names.forEach((name) => root.style.removeProperty(name))
      if (meta && previousColor !== undefined) meta.content = previousColor
    }
  }, [theme])

  return theme
}
