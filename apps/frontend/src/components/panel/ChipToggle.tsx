import type { ChangeEvent } from 'react'

interface ChipToggleProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  /** "checkbox" (várias opções) ou "radio" (uma só); no radio passe também `name`. */
  type?: 'checkbox' | 'radio'
  name?: string
}

/**
 * Opção em formato de chip. Por baixo é um campo de seleção real (teclado e formulário funcionam),
 * o foco aparece no chip e "marcado" nunca depende só da cor: há um ícone de check.
 */
export default function ChipToggle({ label, checked, onChange, disabled, type = 'checkbox', name }: ChipToggleProps) {
  return (
    <label className={`chip-toggle${checked ? ' chip-toggle--on' : ''}${disabled ? ' chip-toggle--disabled' : ''}`}>
      <input
        type={type}
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.checked)}
      />
      <span className="chip-toggle__body">
        <svg className="chip-toggle__check" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {label}
      </span>
    </label>
  )
}
