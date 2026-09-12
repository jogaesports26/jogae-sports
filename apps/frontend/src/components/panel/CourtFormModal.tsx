import { useState } from 'react'
import type { FormEvent } from 'react'
import { useEscapeToClose } from '../../hooks/useEscapeToClose'
import { SessionExpiredError } from '../../lib/api'
import {
  createCourt,
  replacePriceRules,
  replaceRecurringMaintenanceBlocks,
  updateCourt,
  SPORT_OPTIONS,
  SURFACE_OPTIONS,
  WEEKDAY_LABELS,
} from '../../lib/courts'
import type { Court, PriceRule, RecurringMaintenanceBlock } from '../../lib/courts'
import './CourtFormModal.css'

interface CourtFormModalProps {
  court: Court | null
  onClose: () => void
  onSaved: () => void
  onSessionExpired: () => void
}

interface PriceRuleDraft {
  dayOfWeek: number
  startTime: string
  endTime: string
  price: string
}

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60).toString().padStart(2, '0')
  const mins = (minutes % 60).toString().padStart(2, '0')
  return `${hours}:${mins}`
}

function timeToMinutes(time: string) {
  const [hours, mins] = time.split(':').map(Number)
  return hours * 60 + mins
}

function toDraft(rule: PriceRule): PriceRuleDraft {
  return {
    dayOfWeek: rule.dayOfWeek,
    startTime: minutesToTime(rule.startMinute),
    endTime: minutesToTime(rule.endMinute),
    price: rule.pricePerHour,
  }
}

interface BlockDraft {
  dayOfWeek: number
  startTime: string
  endTime: string
  reason: string
}

function toBlockDraft(block: RecurringMaintenanceBlock): BlockDraft {
  return {
    dayOfWeek: block.dayOfWeek,
    startTime: minutesToTime(block.startMinute),
    endTime: minutesToTime(block.endMinute),
    reason: block.reason ?? '',
  }
}

export default function CourtFormModal({ court, onClose, onSaved, onSessionExpired }: CourtFormModalProps) {
  useEscapeToClose(onClose)
  const [savedCourt, setSavedCourt] = useState<Court | null>(court)
  const [name, setName] = useState(court?.name ?? '')
  const [sport, setSport] = useState(court?.sport ?? SPORT_OPTIONS[0].value)
  const [surfaceType, setSurfaceType] = useState(court?.surfaceType ?? SURFACE_OPTIONS[0].value)
  const [hasLighting, setHasLighting] = useState(court?.hasLighting ?? false)
  const [photoUrlsText, setPhotoUrlsText] = useState((court?.photoUrls ?? []).join('\n'))
  const [priceRules, setPriceRules] = useState<PriceRuleDraft[]>((court?.priceRules ?? []).map(toDraft))
  const [blocks, setBlocks] = useState<BlockDraft[]>(
    (court?.recurringMaintenanceBlocks ?? []).map(toBlockDraft),
  )
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
      const result = savedCourt ? await updateCourt(savedCourt.id, input) : await createCourt(input)
      setSavedCourt(result)
      onSaved()
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

  function addPriceRule() {
    setPriceRules((rules) => [...rules, { dayOfWeek: 1, startTime: '08:00', endTime: '09:00', price: '' }])
  }

  function updatePriceRule(index: number, patch: Partial<PriceRuleDraft>) {
    setPriceRules((rules) => rules.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)))
  }

  function removePriceRule(index: number) {
    setPriceRules((rules) => rules.filter((_, i) => i !== index))
  }

  async function handleSavePriceRules() {
    if (!savedCourt) return
    setIsSaving(true)
    setError('')

    try {
      await replacePriceRules(
        savedCourt.id,
        priceRules.map((rule) => ({
          dayOfWeek: rule.dayOfWeek,
          startMinute: timeToMinutes(rule.startTime),
          endMinute: timeToMinutes(rule.endTime),
          pricePerHour: Number(rule.price),
        })),
      )
      onSaved()
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
        return
      }
      setError(err instanceof Error ? err.message : 'Não foi possível salvar os preços')
    } finally {
      setIsSaving(false)
    }
  }

  function addBlock() {
    setBlocks((rows) => [...rows, { dayOfWeek: 1, startTime: '08:00', endTime: '09:00', reason: '' }])
  }

  function updateBlock(index: number, patch: Partial<BlockDraft>) {
    setBlocks((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function removeBlock(index: number) {
    setBlocks((rows) => rows.filter((_, i) => i !== index))
  }

  async function handleSaveBlocks() {
    if (!savedCourt) return
    setIsSaving(true)
    setError('')

    try {
      await replaceRecurringMaintenanceBlocks(
        savedCourt.id,
        blocks.map((block) => ({
          dayOfWeek: block.dayOfWeek,
          startMinute: timeToMinutes(block.startTime),
          endMinute: timeToMinutes(block.endTime),
          reason: block.reason || undefined,
        })),
      )
      onSaved()
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
        return
      }
      setError(err instanceof Error ? err.message : 'Não foi possível salvar os bloqueios')
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

        <h2>{savedCourt ? 'Editar quadra' : 'Nova quadra'}</h2>

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
            {isSaving ? 'Salvando...' : savedCourt ? 'Salvar alterações' : 'Cadastrar quadra'}
          </button>
        </form>

        {savedCourt && (
          <div className="court-modal__prices">
            <h3>Preços por horário</h3>
            <p className="court-modal__prices-hint">
              Defina o valor da hora por dia da semana. Só os horários com uma regra cadastrada ficam
              disponíveis pra reserva.
            </p>

            {priceRules.map((rule, index) => (
              <div className="court-modal__price-row" key={index}>
                <select
                  value={rule.dayOfWeek}
                  onChange={(event) => updatePriceRule(index, { dayOfWeek: Number(event.target.value) })}
                >
                  {WEEKDAY_LABELS.map((label, day) => (
                    <option key={day} value={day}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  value={rule.startTime}
                  onChange={(event) => updatePriceRule(index, { startTime: event.target.value })}
                />
                <span>até</span>
                <input
                  type="time"
                  value={rule.endTime}
                  onChange={(event) => updatePriceRule(index, { endTime: event.target.value })}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="R$/hora"
                  value={rule.price}
                  onChange={(event) => updatePriceRule(index, { price: event.target.value })}
                />
                <button
                  type="button"
                  className="court-modal__remove-row"
                  onClick={() => removePriceRule(index)}
                  aria-label="Remover regra"
                >
                  ×
                </button>
              </div>
            ))}

            <button type="button" className="court-modal__add-row" onClick={addPriceRule}>
              + Adicionar horário
            </button>

            <button
              type="button"
              className="court-modal__submit court-modal__submit--secondary"
              onClick={handleSavePriceRules}
              disabled={isSaving}
            >
              {isSaving ? 'Salvando...' : 'Salvar preços'}
            </button>
          </div>
        )}

        {savedCourt && (
          <div className="court-modal__prices">
            <h3>Bloqueios recorrentes</h3>
            <p className="court-modal__prices-hint">
              Horários que ficam sempre indisponíveis nesse dia da semana — por exemplo, manutenção toda
              segunda de manhã. Diferente do bloqueio pontual da agenda, esse se repeita toda semana.
            </p>

            {blocks.map((block, index) => (
              <div className="court-modal__price-row" key={index}>
                <select
                  value={block.dayOfWeek}
                  onChange={(event) => updateBlock(index, { dayOfWeek: Number(event.target.value) })}
                >
                  {WEEKDAY_LABELS.map((label, day) => (
                    <option key={day} value={day}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  value={block.startTime}
                  onChange={(event) => updateBlock(index, { startTime: event.target.value })}
                />
                <span>até</span>
                <input
                  type="time"
                  value={block.endTime}
                  onChange={(event) => updateBlock(index, { endTime: event.target.value })}
                />
                <input
                  type="text"
                  placeholder="Motivo (opcional)"
                  value={block.reason}
                  onChange={(event) => updateBlock(index, { reason: event.target.value })}
                />
                <button
                  type="button"
                  className="court-modal__remove-row"
                  onClick={() => removeBlock(index)}
                  aria-label="Remover bloqueio"
                >
                  ×
                </button>
              </div>
            ))}

            <button type="button" className="court-modal__add-row" onClick={addBlock}>
              + Adicionar bloqueio
            </button>

            <button
              type="button"
              className="court-modal__submit court-modal__submit--secondary"
              onClick={handleSaveBlocks}
              disabled={isSaving}
            >
              {isSaving ? 'Salvando...' : 'Salvar bloqueios'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
