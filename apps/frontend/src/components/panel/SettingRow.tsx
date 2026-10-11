import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import SaveStatus from './SaveStatus'
import { useSaveStatus } from '../../hooks/useSaveStatus'

interface SettingRowProps {
  label: string
  /** Frase de ajuda embaixo do campo, só no modo de edição. */
  hint?: string
  /** Valor atual, como texto. Vazio mostra "Não informado" e o botão vira "Adicionar". */
  value: string
  /** Como mostrar o valor (padrão: o próprio texto). */
  display?: ReactNode
  placeholder?: string
  multiline?: boolean
  inputMode?: 'text' | 'tel' | 'decimal' | 'numeric'
  /** Texto fixo antes do campo, como "R$" ou o início do endereço do link. */
  prefix?: string
  maxLength?: number
  /** Ações extras ao lado de "Editar" (por exemplo, o botão de copiar). */
  extra?: ReactNode
  /** Conteúdo extra dentro do modo de edição (por exemplo, a busca por CEP, que preenche o campo). */
  editorExtra?: (api: { draft: string; setDraft: (value: string) => void }) => ReactNode
  /** Transforma o que a pessoa digita antes de mostrar no campo (por exemplo, o link só com letras minúsculas). */
  normalize?: (value: string) => string
  /** Devolve um texto de erro se o valor não serve; deixa passar com null. */
  validate?: (value: string) => string | null
  onSave: (value: string) => Promise<unknown>
}

/**
 * Linha de configuração: rótulo e valor à esquerda, "Editar" à direita. Ao editar, abre o campo ali mesmo,
 * "Salvar" grava na hora (com o indicador "Salvando… / Salvo") e Esc cancela.
 */
export default function SettingRow({
  label,
  hint,
  value,
  display,
  placeholder,
  multiline,
  inputMode,
  prefix,
  maxLength,
  extra,
  editorExtra,
  normalize,
  validate,
  onSave,
}: SettingRowProps) {
  const id = useId()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [validationError, setValidationError] = useState('')
  const { state, message, run, reset } = useSaveStatus()
  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (editing) fieldRef.current?.focus()
  }, [editing])

  function startEditing() {
    setDraft(value)
    setValidationError('')
    reset()
    setEditing(true)
  }

  function cancel() {
    setEditing(false)
    setValidationError('')
    reset()
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault()
    const error = validate?.(draft) ?? null
    if (error) {
      setValidationError(error)
      return
    }
    setValidationError('')
    const ok = await run(() => onSave(draft))
    if (ok) setEditing(false)
  }

  const hasValue = value.trim().length > 0

  return (
    <div className={`setting-row${editing ? ' setting-row--editing' : ''}`}>
      {!editing ? (
        <>
          <div className="setting-row__text">
            <span className="setting-row__label">{label}</span>
            <span className={`setting-row__value${hasValue ? '' : ' setting-row__value--empty'}`}>
              {hasValue ? (display ?? value) : 'Não informado'}
            </span>
          </div>
          <div className="setting-row__actions">
            {state !== 'idle' && <SaveStatus state={state} message={message} />}
            {extra}
            <button type="button" className="btn btn--outline btn--sm" onClick={startEditing} aria-label={`${hasValue ? 'Editar' : 'Adicionar'}: ${label}`}>
              {hasValue ? 'Editar' : 'Adicionar'}
            </button>
          </div>
        </>
      ) : (
        <form className="setting-row__form" onSubmit={submit} onKeyDown={(event) => event.key === 'Escape' && cancel()}>
          <label className="field" htmlFor={id}>
            <span>{label}</span>
          </label>
          <div className="setting-row__editor">
            {prefix && <span className="setting-row__prefix">{prefix}</span>}
            {multiline ? (
              <textarea
                id={id}
                ref={(node) => {
                  fieldRef.current = node
                }}
                className="input"
                rows={4}
                value={draft}
                maxLength={maxLength}
                placeholder={placeholder}
                onChange={(event) => setDraft(event.target.value)}
                aria-describedby={`${id}-hint`}
              />
            ) : (
              <input
                id={id}
                ref={(node) => {
                  fieldRef.current = node
                }}
                className="input"
                value={draft}
                maxLength={maxLength}
                inputMode={inputMode}
                placeholder={placeholder}
                onChange={(event) => setDraft(normalize ? normalize(event.target.value) : event.target.value)}
                aria-describedby={`${id}-hint`}
              />
            )}
          </div>
          {editorExtra && <div className="setting-row__extra">{editorExtra({ draft, setDraft })}</div>}
          <p className="setting-row__hint" id={`${id}-hint`}>
            {validationError ? <span className="setting-row__error">{validationError}</span> : hint}
          </p>
          <div className="setting-row__buttons">
            <button type="submit" className="btn btn--primary btn--sm" disabled={state === 'saving'}>
              Salvar
            </button>
            <button type="button" className="btn btn--outline btn--sm" onClick={cancel}>
              Cancelar
            </button>
            <SaveStatus state={state} message={message} onRetry={() => void submit()} />
          </div>
        </form>
      )}
    </div>
  )
}
