import { useCallback, useEffect, useRef, useState } from 'react'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

/**
 * Estado do salvamento de uma ou mais ações ("Salvando…", "Salvo", "Não foi possível salvar").
 * `run(action)` executa a ação, mostra o estado e devolve true se deu certo. O "Salvo" some sozinho.
 */
export function useSaveStatus(savedForMs = 2600) {
  const [state, setState] = useState<SaveState>('idle')
  const [message, setMessage] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef(0)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const run = useCallback(
    async (action: () => Promise<unknown>): Promise<boolean> => {
      if (timer.current) clearTimeout(timer.current)
      pending.current += 1
      setState('saving')
      setMessage('')
      try {
        await action()
        pending.current -= 1
        if (pending.current === 0) {
          setState('saved')
          timer.current = setTimeout(() => setState('idle'), savedForMs)
        }
        return true
      } catch (err) {
        pending.current -= 1
        setState('error')
        setMessage(err instanceof Error ? err.message : 'Não foi possível salvar.')
        return false
      }
    },
    [savedForMs],
  )

  const reset = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    setState('idle')
    setMessage('')
  }, [])

  return { state, message, run, reset }
}
