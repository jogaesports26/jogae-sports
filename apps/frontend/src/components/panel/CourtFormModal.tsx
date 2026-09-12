import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEscapeToClose } from '../../hooks/useEscapeToClose'
import { SessionExpiredError } from '../../lib/api'
import { createCourt, updateCourt, SPORT_OPTIONS, SURFACE_OPTIONS } from '../../lib/courts'
import type { Court } from '../../lib/courts'
import './CourtFormModal.css'

interface CourtFormModalProps {
  court: Court | null
  onClose: () => void
  onSaved: () => void
  onSessionExpired: () => void
}

export default function CourtFormModal({ court, onClose, onSaved, onSessionExpired }: CourtFormModalProps) {
  useEscapeToClose(onClose)
  const navigate = useNavigate()
  const [name, setName] = useState(court?.name ?? '')
  const [sport, setSport] = useState(court?.sport ?? SPORT_OPTIONS[0].value)
  const [surfaceType, setSurfaceType] = useState(court?.surfaceType ?? SURFACE_OPTIONS[0].value)
  const [hasLighting, setHasLighting] = useState(court?.hasLighting ?? false)
  const [photoUrlsText, setPhotoUrlsText] = useState((court?.photoUrls ?? []).join('\n'))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSaving(true)
    setError('')

    const photoUrls = photoUrlsText
      .split('\n')
      .map((url) => url.trim())
      .filter(Boolean)

    try {
      const input = { name, sport, surfaceType, hasLighting, photoUrls }
      if (court) {
        await updateCourt(court.id, input)
        onSaved()
      } else {
        const result = await createCourt(input)
        onSaved()
        navigate(`/painel/quadras/${result.id}/precos`)
      }
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
        return
      }
      setError(err instanceof Error ? err.message : 'Não foi possível salvar a quadra')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="court-modal__overlay" onClick={onClose}>
      <div className="court-modal" onClick={(event) => event.stopPropagation()}>
        <button className="court-modal__close" onClick={onClose} aria-label="Fechar">
          ×
        </button>

        <h2>{court ? 'Editar quadra' : 'Nova quadra'}</h2>
        {!court && (
          <p className="court-modal__hint">
            Depois de cadastrar, você configura os preços por horário e a disponibilidade.
          </p>
        )}

        <form onSubmit={handleSubmit} className="court-modal__form">
          <label className="court-modal__field">
            <span>Nome da quadra</span>
            <input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} />
          </label>

          <div className="court-modal__row">
            <label className="court-modal__field">
              <span>Esporte</span>
              <select value={sport} onChange={(event) => setSport(event.target.value)}>
                {SPORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="court-modal__field">
              <span>Piso</span>
              <select value={surfaceType} onChange={(event) => setSurfaceType(event.target.value)}>
                {SURFACE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="court-modal__checkbox">
            <input
              type="checkbox"
              checked={hasLighting}
              onChange={(event) => setHasLighting(event.target.checked)}
            />
            <span>Tem iluminação</span>
          </label>

          <label className="court-modal__field">
            <span>Fotos (uma URL por linha, opcional)</span>
            <textarea
              value={photoUrlsText}
              onChange={(event) => setPhotoUrlsText(event.target.value)}
              rows={2}
              placeholder="https://..."
            />
          </label>

          {error && <p className="court-modal__error">{error}</p>}

          <button type="submit" className="court-modal__submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : court ? 'Salvar alterações' : 'Cadastrar quadra'}
          </button>
        </form>
      </div>
    </div>
  )
}
