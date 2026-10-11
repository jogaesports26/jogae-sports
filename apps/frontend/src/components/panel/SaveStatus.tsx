import type { SaveState } from '../../hooks/useSaveStatus'
import Spinner from './Spinner'

interface SaveStatusProps {
  state: SaveState
  message?: string
  onRetry?: () => void
}

/**
 * Indicador de salvamento: "Salvando…", "Salvo" ou "Não foi possível salvar". A mudança é anunciada
 * a leitores de tela e o estado nunca depende só da cor (sempre há texto e ícone).
 */
export default function SaveStatus({ state, message, onRetry }: SaveStatusProps) {
  return (
    <span className={`save-status save-status--${state}`} role="status" aria-live="polite">
      {state === 'saving' && (
        <>
          <Spinner size="sm" />
          Salvando…
        </>
      )}
      {state === 'saved' && (
        <>
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Salvo
        </>
      )}
      {state === 'error' && (
        <>
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 4.5v4.5M8 11.5v.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          {message || 'Não foi possível salvar.'}
          {onRetry && (
            <button type="button" className="save-status__retry" onClick={onRetry}>
              Tentar de novo
            </button>
          )}
        </>
      )}
    </span>
  )
}
