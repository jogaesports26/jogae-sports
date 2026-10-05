import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEscapeToClose } from '../../hooks/useEscapeToClose'
import ImageDropzone from '../ImageDropzone'
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

const OTHER_VALUE = 'OUTRO'

function initialSelectValue(current: string, options: { value: string }[]): string {
  return options.some((option) => option.value === current) ? current : OTHER_VALUE
}

function initialCustomValue(current: string, options: { value: string }[]): string {
  return options.some((option) => option.value === current) ? '' : current
}

export default function CourtFormModal({ court, onClose, onSaved, onSessionExpired }: CourtFormModalProps) {
  useEscapeToClose(onClose)
  const navigate = useNavigate()
  const [name, setName] = useState(court?.name ?? '')
  const [sport, setSport] = useState(initialSelectValue(court?.sport ?? SPORT_OPTIONS[0].value, SPORT_OPTIONS))
  const [customSport, setCustomSport] = useState(initialCustomValue(court?.sport ?? '', SPORT_OPTIONS))
  const [surfaceType, setSurfaceType] = useState(
    initialSelectValue(court?.surfaceType ?? SURFACE_OPTIONS[0].value, SURFACE_OPTIONS),
  )
  const [customSurfaceType, setCustomSurfaceType] = useState(
    initialCustomValue(court?.surfaceType ?? '', SURFACE_OPTIONS),
  )
  const [hasLighting, setHasLighting] = useState(court?.hasLighting ?? false)
  const [photos, setPhotos] = useState<string[]>(court?.photoUrls ?? [])
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    const finalSport = sport === OTHER_VALUE ? customSport.trim() : sport
    const finalSurfaceType = surfaceType === OTHER_VALUE ? customSurfaceType.trim() : surfaceType

    if (sport === OTHER_VALUE && !finalSport) {
      setError('Informe o nome do esporte')
      return
    }
    if (surfaceType === OTHER_VALUE && !finalSurfaceType) {
      setError('Informe o tipo de piso')
      return
    }

    setIsSaving(true)

    const photoUrls = photos

    try {
      const input = { name, sport: finalSport, surfaceType: finalSurfaceType, hasLighting, photoUrls }
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
          <label className="court-modal__field field">
            <span>Nome da quadra</span>
            <input
              className="input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
            />
          </label>

          <div className="court-modal__row">
            <label className="court-modal__field field">
              <span>Esporte</span>
              <select className="input" value={sport} onChange={(event) => setSport(event.target.value)}>
                {SPORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {sport === OTHER_VALUE && (
                <input
                  className="input"
                  value={customSport}
                  onChange={(event) => setCustomSport(event.target.value)}
                  placeholder="Qual esporte?"
                  required
                />
              )}
            </label>

            <label className="court-modal__field field">
              <span>Piso</span>
              <select className="input" value={surfaceType} onChange={(event) => setSurfaceType(event.target.value)}>
                {SURFACE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {surfaceType === OTHER_VALUE && (
                <input
                  className="input"
                  value={customSurfaceType}
                  onChange={(event) => setCustomSurfaceType(event.target.value)}
                  placeholder="Qual tipo de piso?"
                  required
                />
              )}
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

          <div className="court-modal__field field">
            <span>Fotos da quadra</span>
            <ImageDropzone
              value={photos}
              onChange={setPhotos}
              onProcessingChange={setIsUploadingPhotos}
              multiple
              max={6}
              hint="Até 6 fotos. A primeira aparece como capa da quadra."
            />
          </div>

          {error && <p className="court-modal__error">{error}</p>}

          <button type="submit" className="court-modal__submit" disabled={isSaving || isUploadingPhotos}>
            {isSaving ? 'Salvando...' : court ? 'Salvar alterações' : 'Cadastrar quadra'}
          </button>
        </form>
      </div>
    </div>
  )
}
