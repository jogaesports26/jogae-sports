import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEscapeToClose } from '../../hooks/useEscapeToClose'
import { resizeImageFile } from '../../lib/imageUpload'
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
  const [photoUrlsText, setPhotoUrlsText] = useState((court?.photoUrls ?? []).join('\n'))
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([])
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  async function handlePhotoFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return

    setIsUploadingPhotos(true)
    setError('')
    try {
      const dataUrls = await Promise.all(files.map((file) => resizeImageFile(file)))
      setUploadedPhotos((prev) => [...prev, ...dataUrls])
    } catch {
      setError('Não foi possível processar uma das imagens enviadas')
    } finally {
      setIsUploadingPhotos(false)
    }
  }

  function removeUploadedPhoto(index: number) {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index))
  }

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

    const photoUrls = [
      ...photoUrlsText
        .split('\n')
        .map((url) => url.trim())
        .filter(Boolean),
      ...uploadedPhotos,
    ]

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
              {sport === OTHER_VALUE && (
                <input
                  value={customSport}
                  onChange={(event) => setCustomSport(event.target.value)}
                  placeholder="Qual esporte?"
                  required
                />
              )}
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
              {surfaceType === OTHER_VALUE && (
                <input
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

          <label className="court-modal__field">
            <span>Fotos (uma URL por linha, opcional)</span>
            <textarea
              value={photoUrlsText}
              onChange={(event) => setPhotoUrlsText(event.target.value)}
              rows={2}
              placeholder="https://..."
            />
          </label>

          <label className="court-modal__field">
            <span>Ou envie fotos do seu dispositivo</span>
            <input type="file" accept="image/*" multiple onChange={handlePhotoFiles} disabled={isUploadingPhotos} />
          </label>

          {isUploadingPhotos && <p className="court-modal__hint">Processando imagens...</p>}

          {uploadedPhotos.length > 0 && (
            <div className="court-modal__photo-grid">
              {uploadedPhotos.map((photo, index) => (
                <div key={index} className="court-modal__photo-thumb">
                  <img src={photo} alt={`Foto ${index + 1}`} />
                  <button
                    type="button"
                    className="court-modal__photo-remove"
                    onClick={() => removeUploadedPhoto(index)}
                    aria-label="Remover foto"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && <p className="court-modal__error">{error}</p>}

          <button type="submit" className="court-modal__submit" disabled={isSaving || isUploadingPhotos}>
            {isSaving ? 'Salvando...' : court ? 'Salvar alterações' : 'Cadastrar quadra'}
          </button>
        </form>
      </div>
    </div>
  )
}
