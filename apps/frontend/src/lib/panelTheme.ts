import { useCallback, useState } from 'react'
import { flushSync } from 'react-dom'

export type PanelScheme = 'dark' | 'light'
const KEY = 'jogae_painel_scheme'

/** O painel nasceu escuro (decisão do dono); o claro é uma escolha salva neste aparelho. */
function readScheme(): PanelScheme {
  try {
    return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { ready: Promise<void> }
}

/**
 * Tema claro/escuro do painel. A troca revela o novo tema em círculo a partir do botão (View Transitions);
 * sem suporte a isso, vira um fade curto de cores; com "reduzir movimento", troca na hora.
 */
export function usePanelScheme() {
  const [scheme, setScheme] = useState<PanelScheme>(readScheme)

  const toggle = useCallback(
    (origin?: HTMLElement | null) => {
      const next: PanelScheme = scheme === 'dark' ? 'light' : 'dark'
      const apply = () => {
        flushSync(() => setScheme(next))
        try {
          localStorage.setItem(KEY, next)
        } catch {
          // sem armazenamento: a escolha só vale até recarregar
        }
      }

      const root = document.documentElement
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const doc = document as ViewTransitionDocument

      if (reduced) {
        apply()
        return
      }

      if (doc.startViewTransition) {
        const box = origin?.getBoundingClientRect()
        const x = box ? box.left + box.width / 2 : window.innerWidth / 2
        const y = box ? box.top + box.height / 2 : 0
        const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
        const transition = doc.startViewTransition(apply)
        transition.ready
          .then(() => {
            root.animate(
              { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
              { duration: 520, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', pseudoElement: '::view-transition-new(root)' },
            )
          })
          .catch(() => {})
        return
      }

      root.classList.add('theme-fading')
      apply()
      window.setTimeout(() => root.classList.remove('theme-fading'), 320)
    },
    [scheme],
  )

  return { scheme, toggle }
}
