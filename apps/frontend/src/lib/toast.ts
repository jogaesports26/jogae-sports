export type ToastType = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: number
  type: ToastType
  text: string
}

let toasts: ToastMessage[] = []
let nextId = 1
const listeners = new Set<(toasts: ToastMessage[]) => void>()

function emit() {
  for (const listener of listeners) listener(toasts)
}

/** Usado só pelo ToastHost — chamadas de tela usam showToast. */
export function subscribeToasts(listener: (toasts: ToastMessage[]) => void): () => void {
  listeners.add(listener)
  listener(toasts)
  return () => listeners.delete(listener)
}

export function showToast(text: string, type: ToastType = 'info', durationMs = 4000) {
  const id = nextId++
  toasts = [...toasts, { id, type, text }]
  emit()
  setTimeout(() => dismissToast(id), durationMs)
}

export function dismissToast(id: number) {
  toasts = toasts.filter((toast) => toast.id !== id)
  emit()
}
