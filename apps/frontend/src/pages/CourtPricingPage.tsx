import { useState } from 'react'
import { useCourtDetailContext } from '../components/panel/CourtDetailLayout'
import { SessionExpiredError } from '../lib/api'
import {
  replacePriceRules,
  replaceRecurringMaintenanceBlocks,
  updateCourt,
  WEEKDAY_LABELS,
} from '../lib/courts'
import type { PriceRule, RecurringMaintenanceBlock } from '../lib/courts'
import { formatDuration, WEEKDAY_SHORT } from '../lib/weekGrid'
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

const STEP_OPTIONS = [15, 30, 45, 60, 90, 120]
const MAX_DURATION_OPTIONS = [60, 90, 120, 150, 180, 240, 300, 360, 480]
const MAX_GENERATED_SLOTS = 300

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

function generateSlots(
  days: number[],
  openTime: string,
  closeTime: string,
  stepMinutes: number,
  price: string,
): PriceRuleDraft[] {
  const openMinute = timeToMinutes(openTime)
  const closeMinute = timeToMinutes(closeTime)
  const slots: PriceRuleDraft[] = []

  for (const day of days) {
    for (let start = openMinute; start + stepMinutes <= closeMinute; start += stepMinutes) {
      slots.push({
        dayOfWeek: day,
        startTime: minutesToTime(start),
        endTime: minutesToTime(start + stepMinutes),
        price,
      })
    }
  }

  return slots
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

  const [genDays, setGenDays] = useState<Set<number>>(new Set())
  const [genOpen, setGenOpen] = useState('08:00')
  const [genClose, setGenClose] = useState('22:00')
  const [genStep, setGenStep] = useState(STEP_OPTIONS.includes(court.slotStepMinutes) ? court.slotStepMinutes : 60)
  const [genPrice, setGenPrice] = useState('')
  const [genError, setGenError] = useState('')

  const [minBookingMinutes, setMinBookingMinutes] = useState(court.minBookingMinutes)
  const [maxBookingMinutes, setMaxBookingMinutes] = useState(court.maxBookingMinutes)
  const [bookingStepMinutes, setBookingStepMinutes] = useState(
    STEP_OPTIONS.includes(court.bookingStepMinutes) ? court.bookingStepMinutes : 30,
  )
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)

  function toggleGenDay(day: number) {
    setGenDays((prev) => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

  function handleGenerate() {
    setGenError('')

    if (genDays.size === 0) {
      setGenError('Selecione pelo menos um dia da semana')
      return
    }

    const openMinute = timeToMinutes(genOpen)
    const closeMinute = timeToMinutes(genClose)
    if (closeMinute <= openMinute) {
      setGenError('O horário de fechamento deve ser depois do de abertura')
      return
    }

    if (!genPrice || Number(genPrice) <= 0) {
      setGenError('Informe um preço por hora válido')
      return
    }

    const slotsPerDay = Math.floor((closeMinute - openMinute) / genStep)
    if (slotsPerDay * genDays.size > MAX_GENERATED_SLOTS) {
      setGenError('Isso geraria horários demais de uma vez — tente um passo maior ou um intervalo menor')
      return
    }

    const generated = generateSlots([...genDays], genOpen, genClose, genStep, genPrice)
    setPricesSaved(false)
    setPriceRules((rules) => [...rules.filter((rule) => !genDays.has(rule.dayOfWeek)), ...generated])
  }

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

  async function handleSaveSettings() {
    setSavingSettings(true)
    setError('')
    setSettingsSaved(false)

    try {
      await updateCourt(court.id, {
        minBookingMinutes,
        maxBookingMinutes,
        bookingStepMinutes,
        slotStepMinutes: genStep,
      })
      setSettingsSaved(true)
      reloadCourt()
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
        return
      }
      setError(err instanceof Error ? err.message : 'Não foi possível salvar a configuração')
    } finally {
      setSavingSettings(false)
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

  const rulesByDay = new Map<number, { rule: PriceRuleDraft; index: number }[]>()
  priceRules.forEach((rule, index) => {
    const list = rulesByDay.get(rule.dayOfWeek) ?? []
    list.push({ rule, index })
    rulesByDay.set(rule.dayOfWeek, list)
  })

  return (
    <div className="court-pricing-page">
      {error && <p className="court-pricing-page__error">{error}</p>}

      <div className="court-pricing-page__grid">
      <section className="court-pricing-page__section">
        <h2>Gerar horários automaticamente</h2>
        <p className="court-pricing-page__hint">
          Informe o horário de funcionamento e os dias — os blocos de preço são gerados na
          duração escolhida, e você pode desabilitar individualmente os que não quiser depois.
          Essa duração é só pra organizar os preços: não limita a duração das reservas que os
          jogadores podem fazer (configure isso logo abaixo).
        </p>

        <div className="court-pricing-page__gen-days">
          {WEEKDAY_SHORT.map((label, day) => (
            <button
              key={day}
              type="button"
              className={`court-pricing-page__gen-day${genDays.has(day) ? ' court-pricing-page__gen-day--active' : ''}`}
              onClick={() => toggleGenDay(day)}
              aria-pressed={genDays.has(day)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="court-pricing-page__gen-row">
          <label className="court-pricing-page__gen-field">
            <span>Abertura</span>
            <input type="time" value={genOpen} onChange={(event) => setGenOpen(event.target.value)} />
          </label>
          <label className="court-pricing-page__gen-field">
            <span>Fechamento</span>
            <input type="time" value={genClose} onChange={(event) => setGenClose(event.target.value)} />
          </label>
          <label className="court-pricing-page__gen-field">
            <span>Duração do horário</span>
            <select value={genStep} onChange={(event) => setGenStep(Number(event.target.value))}>
              {STEP_OPTIONS.map((step) => (
                <option key={step} value={step}>
                  {formatDuration(step)}
                </option>
              ))}
            </select>
          </label>
          <label className="court-pricing-page__gen-field">
            <span>Preço por hora</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="R$/hora"
              value={genPrice}
              onChange={(event) => setGenPrice(event.target.value)}
            />
          </label>
        </div>

        {genError && <p className="court-pricing-page__error">{genError}</p>}

        <button type="button" className="btn btn--outline btn--sm" onClick={handleGenerate}>
          Gerar horários
        </button>

        <div className="court-pricing-page__settings">
          <p className="court-pricing-page__hint">
            Essas opções controlam o que o jogador vê na tela de reserva — independente de como
            os preços foram cadastrados acima.
          </p>
          <label className="court-pricing-page__gen-field">
            <span>Intervalo entre horários oferecidos</span>
            <select
              value={bookingStepMinutes}
              onChange={(event) => setBookingStepMinutes(Number(event.target.value))}
            >
              {STEP_OPTIONS.map((step) => (
                <option key={step} value={step}>
                  {formatDuration(step)}
                </option>
              ))}
            </select>
          </label>
          <label className="court-pricing-page__gen-field">
            <span>Duração mínima de uma reserva</span>
            <select
              value={minBookingMinutes}
              onChange={(event) => setMinBookingMinutes(Number(event.target.value))}
            >
              {STEP_OPTIONS.map((step) => (
                <option key={step} value={step}>
                  {formatDuration(step)}
                </option>
              ))}
            </select>
          </label>
          <label className="court-pricing-page__gen-field">
            <span>Duração máxima de uma reserva</span>
            <select
              value={maxBookingMinutes ?? ''}
              onChange={(event) => setMaxBookingMinutes(event.target.value ? Number(event.target.value) : null)}
            >
              <option value="">Sem limite</option>
              {MAX_DURATION_OPTIONS.map((step) => (
                <option key={step} value={step}>
                  {formatDuration(step)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={handleSaveSettings}
            disabled={savingSettings}
          >
            {savingSettings ? 'Salvando...' : 'Salvar configurações de reserva'}
          </button>
          {settingsSaved && <span className="court-pricing-page__saved">Salvo!</span>}
        </div>
      </section>

      <section className="court-pricing-page__section">
        <h2>Preços por horário</h2>
        <p className="court-pricing-page__hint">
          Defina o valor da hora por dia da semana. Só os horários com uma regra cadastrada ficam
          disponíveis pra reserva. Clique no × de um horário pra desabilitá-lo.
        </p>

        {[...rulesByDay.keys()].sort((a, b) => a - b).map((day) => (
          <div className="court-pricing-page__day-group" key={day}>
            <strong>{WEEKDAY_LABELS[day]}</strong>
            <div className="court-pricing-page__chips">
              {rulesByDay.get(day)!.map(({ rule, index }) => (
                <span className="court-pricing-page__chip" key={index}>
                  {rule.startTime}–{rule.endTime} · R$ {rule.price || '0'}
                  <button
                    type="button"
                    onClick={() => removePriceRule(index)}
                    aria-label={`Remover horário ${rule.startTime}–${rule.endTime} de ${WEEKDAY_LABELS[day]}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        ))}

        {priceRules.length === 0 && (
          <p className="court-pricing-page__hint">Nenhum horário cadastrado ainda.</p>
        )}

        <details className="court-pricing-page__manual">
          <summary>Adicionar horário manualmente (preço especial, exceção etc.)</summary>
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
        </details>

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
