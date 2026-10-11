interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  /** Texto só para leitor de tela. Sem ele o spinner é decorativo (use quando já há texto ao lado). */
  label?: string
}

/** Anel girando, só CSS. Um componente só para o sistema inteiro (botões, indicador de salvamento, ações curtas). */
export default function Spinner({ size = 'md', label }: SpinnerProps) {
  return (
    <span className={`spinner spinner--${size}`} role={label ? 'status' : undefined} aria-hidden={label ? undefined : true}>
      {label && <span className="sr-only">{label}</span>}
    </span>
  )
}
