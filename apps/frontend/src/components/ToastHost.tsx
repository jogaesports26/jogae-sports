import { useEffect, useState } from 'react'
import { dismissToast, subscribeToasts } from '../lib/toast'
import type { ToastMessage } from '../lib/toast'
import './ToastHost.css'

export default function ToastHost() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => subscribeToasts(setToasts), [])

  if (toasts.length === 0) return null

  return (
    <div className="toast-host" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type}`} onClick={() => dismissToast(toast.id)}>
          {toast.text}
        </div>
      ))}
    </div>
  )
}
