import { useEffect, useRef, useState } from 'react'

interface CopyButtonProps {
  text: string
  label?: string
  onCopied?: () => void
}

type CopyState = 'idle' | 'copied' | 'failed'

/** Copia para a área de transferência com cópia alternativa (campo selecionável) e retorno claro do que aconteceu. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const area = document.createElement('textarea')
      area.value = text
      area.setAttribute('readonly', '')
      area.style.position = 'fixed'
      area.style.opacity = '0'
      document.body.appendChild(area)
      area.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(area)
      return ok
    } catch {
      return false
    }
  }
}

export default function CopyButton({ text, label = 'Copiar', onCopied }: CopyButtonProps) {
  const [state, setState] = useState<CopyState>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  async function handleClick() {
    const ok = await copyText(text)
    setState(ok ? 'copied' : 'failed')
    if (ok) onCopied?.()
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 1800)
  }

  return (
    <button type="button" className={`btn btn--outline btn--sm copy-btn copy-btn--${state}`} onClick={handleClick}>
      <span className="copy-btn__icon" aria-hidden="true">
        <svg className="copy-btn__ic-copy" viewBox="0 0 16 16" fill="none">
          <rect x="5.5" y="5.5" width="8" height="8" rx="1.8" stroke="currentColor" strokeWidth="1.6" />
          <path d="M10.5 3.5h-6a1.5 1.5 0 0 0-1.5 1.5v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <svg className="copy-btn__ic-check" viewBox="0 0 16 16" fill="none">
          <path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span>{state === 'copied' ? 'Copiado' : state === 'failed' ? 'Não copiou' : label}</span>
      <span className="sr-only" role="status" aria-live="polite">
        {state === 'copied' ? 'Copiado para a área de transferência' : state === 'failed' ? 'Não foi possível copiar. Selecione o texto e copie à mão.' : ''}
      </span>
    </button>
  )
}
