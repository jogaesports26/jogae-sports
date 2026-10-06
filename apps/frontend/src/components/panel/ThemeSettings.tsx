import { useEffect, useRef, useState } from 'react'
import { SessionExpiredError } from '../../lib/api'
import { previewTheme, restoreTheme, updateProfile } from '../../lib/profile'
import { THEME_PRESET_OPTIONS } from '../../lib/theme'
import type { ResolvedTheme, StoredTheme, ThemeInput } from '../../lib/theme'
import { showToast } from '../../lib/toast'
import ImageDropzone from '../ImageDropzone'
import './ThemeSettings.css'

interface ThemeSettingsProps {
  initial: StoredTheme | null
  storeName: string
  onSessionExpired: () => void
}

const RADIUS_OPTIONS = [
  { value: 'sm', label: 'Reto' },
  { value: 'md', label: 'Médio' },
  { value: 'lg', label: 'Arredondado' },
] as const

const FONT_OPTIONS = [
  { value: 'inter', label: 'Moderna (Inter)' },
  { value: 'system', label: 'Do sistema' },
  { value: 'serif', label: 'Com serifa' },
] as const

function toInput(theme: StoredTheme | null): ThemeInput {
  if (!theme) return { preset: 'jogae' }
  const { preset, primary, action, radius, font, logoUrl, coverUrl } = theme
  return { preset, primary, action, radius, font, logoUrl, coverUrl }
}

function describe(version: ThemeInput) {
  const preset = THEME_PRESET_OPTIONS.find((option) => option.key === version.preset)?.label
  return version.primary ? `Cores personalizadas` : (preset ?? 'Tema padrão')
}

export default function ThemeSettings({ initial, storeName, onSessionExpired }: ThemeSettingsProps) {
  const [saved, setSaved] = useState<StoredTheme | null>(initial)
  const [input, setInput] = useState<ThemeInput>(() => toInput(initial))
  const [preview, setPreview] = useState<ResolvedTheme | null>(initial?.resolved ?? null)
  const [previewError, setPreviewError] = useState('')
  const [saving, setSaving] = useState(false)
  const [customColors, setCustomColors] = useState(Boolean(initial?.primary))
  const requestId = useRef(0)

  // Preview ao vivo: o backend é a fonte única da derivação (OKLCH + contraste AA); aqui só pedimos com debounce.
  useEffect(() => {
    const id = ++requestId.current
    const timer = setTimeout(() => {
      previewTheme(input)
        .then((result) => {
          if (id !== requestId.current) return
          setPreview(result)
          setPreviewError('')
        })
        .catch((err) => {
          if (id !== requestId.current) return
          if (err instanceof SessionExpiredError) {
            onSessionExpired()
            return
          }
          setPreviewError(err instanceof Error ? err.message : 'Não foi possível calcular o tema')
        })
    }, 250)
    return () => clearTimeout(timer)
  }, [input, onSessionExpired])

  function patch(change: Partial<ThemeInput>) {
    setInput((prev) => ({ ...prev, ...change }))
  }

  function choosePreset(key: string) {
    // Escolher um preset limpa as cores personalizadas.
    setInput((prev) => ({ ...prev, preset: key, primary: undefined, action: undefined }))
    setCustomColors(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const profile = await updateProfile({ theme: input })
      setSaved(profile.theme)
      showToast('Aparência da lojinha salva.', 'success')
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
        return
      }
      showToast(err instanceof Error ? err.message : 'Não foi possível salvar', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleRestore(index: number) {
    try {
      const restored = await restoreTheme(index)
      setSaved(restored)
      setInput(toInput(restored))
      setCustomColors(Boolean(restored.primary))
      showToast('Versão anterior restaurada.', 'success')
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
        return
      }
      showToast(err instanceof Error ? err.message : 'Não foi possível restaurar', 'error')
    }
  }

  const vars = preview?.cssVars
  const primaryValue = input.primary ?? vars?.['--brand-primary'] ?? ''
  const actionValue = input.action ?? vars?.['--brand-action'] ?? ''

  return (
    <div className="theme-settings">
      <div className="theme-settings__controls">
        <fieldset className="theme-settings__group">
          <legend>Estilo</legend>
          <div className="theme-presets" role="radiogroup" aria-label="Estilo da lojinha">
            {THEME_PRESET_OPTIONS.map((option) => {
              const active = !customColors && (input.preset ?? 'jogae') === option.key
              return (
                <button
                  key={option.key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`theme-preset${active ? ' theme-preset--active' : ''}`}
                  onClick={() => choosePreset(option.key)}
                >
                  <span className="theme-preset__swatch" aria-hidden="true">
                    <span style={{ background: option.swatch[0] }} />
                    <span style={{ background: option.swatch[1] }} />
                  </span>
                  {option.label}
                </button>
              )
            })}
          </div>

          <label className="theme-settings__toggle">
            <input
              type="checkbox"
              checked={customColors}
              onChange={(event) => {
                setCustomColors(event.target.checked)
                if (event.target.checked) {
                  patch({ primary: vars?.['--brand-primary'], action: vars?.['--brand-action'] })
                } else {
                  patch({ primary: undefined, action: undefined })
                }
              }}
            />
            Personalizar as cores
          </label>

          {customColors && (
            <div className="theme-colors">
              <label className="field">
                <span>Cor principal</span>
                <span className="theme-colors__row">
                  <input
                    type="color"
                    className="theme-colors__picker"
                    value={primaryValue}
                    onChange={(event) => patch({ primary: event.target.value })}
                    aria-label="Cor principal"
                  />
                  <input
                    className="input input--sm"
                    value={primaryValue}
                    onChange={(event) => patch({ primary: event.target.value })}
                    maxLength={7}
                    aria-label="Cor principal em hexadecimal"
                  />
                </span>
              </label>
              <label className="field">
                <span>Cor do botão de reservar</span>
                <span className="theme-colors__row">
                  <input
                    type="color"
                    className="theme-colors__picker"
                    value={actionValue}
                    onChange={(event) => patch({ action: event.target.value })}
                    aria-label="Cor do botão de reservar"
                  />
                  <input
                    className="input input--sm"
                    value={actionValue}
                    onChange={(event) => patch({ action: event.target.value })}
                    maxLength={7}
                    aria-label="Cor do botão em hexadecimal"
                  />
                </span>
                <small>Se você não mexer, o botão usa a cor principal.</small>
              </label>
            </div>
          )}
        </fieldset>

        <fieldset className="theme-settings__group">
          <legend>Formato</legend>
          <label className="field field--sm">
            <span>Cantos</span>
            <select className="input" value={input.radius ?? 'md'} onChange={(event) => patch({ radius: event.target.value as ThemeInput['radius'] })}>
              {RADIUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field field--sm">
            <span>Letra</span>
            <select className="input" value={input.font ?? 'inter'} onChange={(event) => patch({ font: event.target.value as ThemeInput['font'] })}>
              {FONT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </fieldset>

        <fieldset className="theme-settings__group">
          <legend>Logo e capa</legend>
          <div className="field">
            <span>Logo do estabelecimento</span>
            <ImageDropzone
              value={input.logoUrl ? [input.logoUrl] : []}
              onChange={(urls) => patch({ logoUrl: urls[0] })}
              hint="Quadrada funciona melhor. Aparece no topo da lojinha."
            />
          </div>
          <div className="field">
            <span>Capa da lojinha</span>
            <ImageDropzone
              value={input.coverUrl ? [input.coverUrl] : []}
              onChange={(urls) => patch({ coverUrl: urls[0] })}
              hint="Também aparece na prévia do link no WhatsApp."
            />
          </div>
        </fieldset>

        <div className="theme-settings__actions">
          <button type="button" className="btn btn--primary" onClick={handleSave} disabled={saving || Boolean(previewError)}>
            {saving ? 'Salvando...' : 'Salvar aparência'}
          </button>
          {saved && <span className="theme-settings__version">Versão {saved.rev} no ar</span>}
        </div>

        {saved && saved.history.length > 0 && (
          <section className="theme-history" aria-label="Versões anteriores">
            <h3>Versões anteriores</h3>
            <ul>
              {saved.history.map((version, index) => (
                <li key={index}>
                  <span>
                    Versão {saved.rev - index - 1} · {describe(version)}
                  </span>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => handleRestore(index)}>
                    Restaurar
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <aside className="theme-settings__preview" aria-label="Prévia da lojinha">
        <p className="theme-settings__preview-title">Prévia ao vivo</p>
        {previewError ? (
          <p className="theme-settings__error" role="alert">
            {previewError}
          </p>
        ) : (
          vars && (
            <div className="theme-mock" style={vars}>
              <div className="theme-mock__hero">
                {input.logoUrl && <img src={input.logoUrl} alt="" className="theme-mock__logo" />}
                <strong>{storeName || 'Seu estabelecimento'}</strong>
                <span>Rua Exemplo, 123 · Centro</span>
              </div>
              <div className="theme-mock__body">
                <p className="theme-mock__price">
                  a partir de <strong>R$ 80</strong> por hora
                </p>
                <div className="theme-mock__pills">
                  <span className="theme-mock__pill">18:00</span>
                  <span className="theme-mock__pill theme-mock__pill--active">19:00</span>
                  <span className="theme-mock__pill">20:00</span>
                </div>
                <a className="theme-mock__link" href="#preview" onClick={(event) => event.preventDefault()}>
                  Ver comodidades
                </a>
                <button type="button" className="theme-mock__cta" tabIndex={-1}>
                  Reservar agora
                </button>
              </div>
            </div>
          )
        )}
        {preview?.adjustments.map((message) => (
          <p key={message} className="theme-settings__note">
            {message}
          </p>
        ))}
        {preview?.warnings.map((message) => (
          <p key={message} className="theme-settings__note theme-settings__note--warn">
            {message}
          </p>
        ))}
      </aside>
    </div>
  )
}
