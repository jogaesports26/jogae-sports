import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  const [active, setActive] = useState(court?.active ?? true)
  const [photos, setPhotos] = useState<string[]>(court?.photoUrls ?? [])
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  // Só pede confirmação se algo mudou: fechar sem mexer em nada é direto.
  const isDirty = court
    ? name !== court.name ||
      (sport === OTHER_VALUE ? customSport : sport) !== court.sport ||
      (surfaceType === OTHER_VALUE ? customSurfaceType : surfaceType) !== court.surfaceType ||
      hasLighting !== court.hasLighting ||
      active !== court.active ||
      photos.join('|') !== court.photoUrls.join('|')
    : name !== '' || photos.length > 0

  function requestClose() {
    if (isDirty && !window.confirm('Descartar as alterações que você ainda não salvou?')) return
    onClose()
  }
  useEscapeToClose(requestClose)

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
        await updateCourt(court.id, { ...input, active })
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
    <div className="court-modal__overlay" onClick={requestClose}>
      <div
        className="court-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="court-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="court-modal__header">
          <div>
            <h2 id="court-modal-title">{court ? 'Editar quadra' : 'Nova quadra'}</h2>
            <p className="court-modal__hint">
              {court
                ? court.name
                : 'Depois de cadastrar, você configura os preços por horário e a disponibilidade.'}
            </p>
          </div>
          <button type="button" className="court-modal__close" onClick={requestClose} aria-label="Fechar">
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit} className="court-modal__form">
          <div className="court-modal__body">
            <section className="court-modal__section" aria-labelledby="court-modal-data">
              <h3 id="court-modal-data">Dados</h3>

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
                <input type="checkbox" checked={hasLighting} onChange={(event) => setHasLighting(event.target.checked)} />
                <span>Tem iluminação</span>
              </label>
            </section>

            <section className="court-modal__section" aria-labelledby="court-modal-photos">
              <h3 id="court-modal-photos">Fotos</h3>
              <ImageDropzone
                value={photos}
                onChange={setPhotos}
                onProcessingChange={setIsUploadingPhotos}
                multiple
                max={6}
                hint="Até 6 fotos. A primeira aparece como capa da quadra."
              />
            </section>

            {court && (
              <section className="court-modal__section" aria-labelledby="court-modal-status">
                <h3 id="court-modal-status">Status</h3>
                <label className="court-modal__checkbox court-modal__checkbox--stacked">
                  <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
                  <span>
                    Quadra ativa
                    <small>Inativa não recebe reservas novas e some da agenda de todas as quadras.</small>
                  </span>
                </label>
                <p className="court-modal__more">
                  Duração das reservas, preços e bloqueios ficam em{' '}
                  <Link to={`/painel/quadras/${court.id}/precos`}>Preços & disponibilidade</Link>.
                </p>
              </section>
            )}
          </div>

          <footer className="court-modal__footer">
            {error && <p className="court-modal__error" role="alert">{error}</p>}
            <div className="court-modal__actions">
              <button type="button" className="court-modal__cancel" onClick={requestClose}>
                Cancelar
              </button>
              <button type="submit" className="court-modal__submit" disabled={isSaving || isUploadingPhotos || (!!court && !isDirty)}>
                {isSaving ? 'Salvando...' : court ? 'Salvar alterações' : 'Cadastrar quadra'}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  )
}
