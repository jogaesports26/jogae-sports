import { useEscapeToClose } from '../../hooks/useEscapeToClose'
import './ConfirmDialog.css'

type ConfirmDialogProps = {
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

/** Confirmação no padrão visual do sistema, no lugar do `window.confirm` do navegador. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Voltar',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEscapeToClose(onCancel)

  return (
    <div className="confirm-dialog__overlay" onClick={onCancel}>
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-dialog-title">{title}</h2>
        <p id="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel} autoFocus>
            {cancelLabel}
          </button>
          <button type="button" className="btn btn--danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
