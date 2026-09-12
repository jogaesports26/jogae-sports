import { useState } from 'react'
import { useCourtDetailContext } from '../components/panel/CourtDetailLayout'
import { SessionExpiredError } from '../lib/api'
import { replacePriceRules, replaceRecurringMaintenanceBlocks, WEEKDAY_LABELS } from '../lib/courts'
import type { PriceRule, RecurringMaintenanceBlock } from '../lib/courts'
import './CourtPricingPage.css'

interface PriceRuleDraft {
  dayOfWeek: number
  startTime: string
  endTime: string
  price: string
}

interface BlockDraft {
  dayOfWeek: number
  startTime: string
  endTime: string
  reason: string
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

function toBlockDraft(block: RecurringMaintenanceBlock): BlockDraft {
  return {
    dayOfWeek: block.dayOfWeek,
    startTime: minutesToTime(block.startMinute),
    endTime: minutesToTime(block.endMinute),
    reason: block.reason ?? '',
  }
}

export default function CourtPricingPage() {
  const { court, reloadCourt, onSessionExpired } = useCourtDetailContext()
  const [priceRules, setPriceRules] = useState<PriceRuleDraft[]>(court.priceRules.map(toDraft))
  const [blocks, setBlocks] = useState<BlockDraft[]>(court.recurringMaintenanceBlocks.map(toBlockDraft))
  const [savingPrices, setSavingPrices] = useState(false)
  const [savingBlocks, setSavingBlocks] = useState(false)
  const [pricesSaved, setPricesSaved] = useState(false)
  const [blocksSaved, setBlocksSaved] = useState(false)
  const [error, setError] = useState('')

  function addPriceRule() {
    setPricesSaved(false)
    setPriceRules((rules) => [...rules, { dayOfWeek: 1, startTime: '08:00', endTime: '09:00', price: '' }])
  }

  function updatePriceRule(index: number, patch: Partial<PriceRuleDraft>) {
    setPricesSaved(false)
    setPriceRules((rules) => rules.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)))
  }

  function removePriceRule(index: number) {
    setPricesSaved(false)
    setPriceRules((rules) => rules.filter((_, i) => i !== index))
  }

  async function handleSavePriceRules() {
    setSavingPrices(true)
    setError('')
    setPricesSaved(false)

    try {
      await replacePriceRules(
        court.id,
        priceRules.map((rule) => ({
          dayOfWeek: rule.dayOfWeek,
          startMinute: timeToMinutes(rule.startTime),
          endMinute: timeToMinutes(rule.endTime),
          pricePerHour: Number(rule.price),
        })),
      )
      setPricesSaved(true)
      reloadCourt()
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
        return
      }
      setError(err instanceof Error ? err.message : 'Não foi possível salvar os preços')
    } finally {
      setSavingPrices(false)
    }
  }

  function addBlock() {
    setBlocksSaved(false)
    setBlocks((rows) => [...rows, { dayOfWeek: 1, startTime: '08:00', endTime: '09:00', reason: '' }])
  }

  function updateBlock(index: number, patch: Partial<BlockDraft>) {
    setBlocksSaved(false)
    setBlocks((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function removeBlock(index: number) {
    setBlocksSaved(false)
    setBlocks((rows) => rows.filter((_, i) => i !== index))
  }

  async function handleSaveBlocks() {
    setSavingBlocks(true)
    setError('')
    setBlocksSaved(false)

    try {
      await replaceRecurringMaintenanceBlocks(
        court.id,
        blocks.map((block) => ({
          dayOfWeek: block.dayOfWeek,
          startMinute: timeToMinutes(block.startTime),
          endMinute: timeToMinutes(block.endTime),
          reason: block.reason || undefined,
        })),
      )
      setBlocksSaved(true)
      reloadCourt()
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
        return
      }
      setError(err instanceof Error ? err.message : 'Não foi possível salvar os bloqueios')
    } finally {
      setSavingBlocks(false)
    }
  }

  return (
    <div className="court-pricing-page">
      {error && <p className="court-pricing-page__error">{error}</p>}

      <div className="court-pricing-page__grid">
      <section className="court-pricing-page__section">
        <h2>Preços por horário</h2>
        <p className="court-pricing-page__hint">
          Defina o valor da hora por dia da semana. Só os horários com uma regra cadastrada ficam
          disponíveis pra reserva.
        </p>

        {priceRules.map((rule, index) => (
          <div className="court-pricing-page__row" key={index}>
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
              className="court-pricing-page__remove-row"
              onClick={() => removePriceRule(index)}
              aria-label="Remover regra"
            >
              ×
            </button>
          </div>
        ))}

        <button type="button" className="court-pricing-page__add-row" onClick={addPriceRule}>
          + Adicionar horário
        </button>

        <div className="court-pricing-page__save-row">
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={handleSavePriceRules}
            disabled={savingPrices}
          >
            {savingPrices ? 'Salvando...' : 'Salvar preços'}
          </button>
          {pricesSaved && <span className="court-pricing-page__saved">Salvo!</span>}
        </div>
      </section>

      <section className="court-pricing-page__section">
        <h2>Bloqueios recorrentes</h2>
        <p className="court-pricing-page__hint">
          Horários que ficam sempre indisponíveis nesse dia da semana — por exemplo, manutenção toda
          segunda de manhã. Diferente do bloqueio pontual (na aba Manutenção), esse se repete toda
          semana.
        </p>

        {blocks.map((block, index) => (
          <div className="court-pricing-page__row" key={index}>
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
              className="court-pricing-page__remove-row"
              onClick={() => removeBlock(index)}
              aria-label="Remover bloqueio"
            >
              ×
            </button>
          </div>
        ))}

        <button type="button" className="court-pricing-page__add-row" onClick={addBlock}>
          + Adicionar bloqueio
        </button>

        <div className="court-pricing-page__save-row">
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={handleSaveBlocks}
            disabled={savingBlocks}
          >
            {savingBlocks ? 'Salvando...' : 'Salvar bloqueios'}
          </button>
          {blocksSaved && <span className="court-pricing-page__saved">Salvo!</span>}
        </div>
      </section>
      </div>
    </div>
  )
}
