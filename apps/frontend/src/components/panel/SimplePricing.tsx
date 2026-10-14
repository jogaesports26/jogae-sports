import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SessionExpiredError } from '../../lib/api'
import { replacePriceRules } from '../../lib/courts'
import type { Court, PriceRuleInput } from '../../lib/courts'
import { useSaveStatus } from '../../hooks/useSaveStatus'
import { buildCourtChange } from '../../lib/priceSummary'
import type { ChangeKind } from '../../lib/priceSummary'
import { showToast } from '../../lib/toast'
import ChipToggle from './ChipToggle'
import SaveStatus from './SaveStatus'

interface SimplePricingProps {
  courts: Court[]
  onApplied: () => void
  onSessionExpired: () => void
}

const HOURS = Array.from({ length: 25 }, (_, hour) => hour)

const CHANGE_LABEL: Record<ChangeKind, string> = {
  new: 'Passa a ter preços',
  same: 'Sem mudança',
  'replaces-simple': 'Substitui',
  'replaces-custom': '⚠ Perde o detalhe por dia e hora',
}

function money(value: string) {
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

/** Descobre o preço que já vale numa hora do dia (segunda-feira) para preencher os campos. */
function currentPrice(court: Court | undefined, minute: number) {
  const rule = court?.priceRules.find((r) => r.dayOfWeek === 1 && r.startMinute <= minute && minute < r.endMinute)
  return rule ? String(Number(rule.pricePerHour)) : ''
}

/**
 * Preço em três campos (dia, noite, fim de semana) aplicado a várias quadras de uma vez.
 * A grade completa por dia e hora continua existindo na página de preços de cada quadra.
 */
export default function SimplePricing({ courts, onApplied, onSessionExpired }: SimplePricingProps) {
  const first = courts[0]
  const [selected, setSelected] = useState<string[]>(() => courts.map((court) => court.id))
  const [open, setOpen] = useState(6)
  const [close, setClose] = useState(23)
  const [nightStart, setNightStart] = useState(18)
  const [dayPrice, setDayPrice] = useState(() => currentPrice(first, 12 * 60))
  const [nightPrice, setNightPrice] = useState(() => currentPrice(first, 20 * 60))
  const [weekendMode, setWeekendMode] = useState<'same' | 'extra'>('same')
  const [weekendExtra, setWeekendExtra] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const { state, message, run } = useSaveStatus(4000)

  const rules = useMemo<PriceRuleInput[] | null>(() => {
    const day = money(dayPrice)
    const night = money(nightPrice)
    const extra = weekendMode === 'extra' ? (money(weekendExtra) ?? 0) : 0
    if (day === null || night === null || close <= open) return null

    const result: PriceRuleInput[] = []
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek += 1) {
      const add = dayOfWeek === 0 || dayOfWeek === 6 ? extra : 0
      const split = Math.min(Math.max(nightStart, open), close)
      if (split > open) result.push({ dayOfWeek, startMinute: open * 60, endMinute: split * 60, pricePerHour: day + add })
      if (close > split) result.push({ dayOfWeek, startMinute: split * 60, endMinute: close * 60, pricePerHour: night + add })
    }
    return result
  }, [dayPrice, nightPrice, weekendMode, weekendExtra, open, close, nightStart])

  const courtName = (id: string) => courts.find((court) => court.id === id)?.name ?? 'quadra'

  function toggleCourt(id: string, checked: boolean) {
    setSelected((current) => (checked ? [...current, id] : current.filter((courtId) => courtId !== id)))
  }

  function review() {
    if (selected.length === 0) {
      setError('Escolha pelo menos uma quadra.')
      return
    }
    if (!rules) {
      setError(close <= open ? 'O horário de fechar precisa ser depois do de abrir.' : 'Informe os preços de dia e de noite, em reais.')
      return
    }
    setError('')
    setConfirming(true)
  }

  async function apply() {
    if (!rules) return
    const ok = await run(async () => {
      const done: string[] = []
      for (const [index, courtId] of selected.entries()) {
        try {
          await replacePriceRules(courtId, rules)
          done.push(courtName(courtId))
        } catch (err) {
          if (err instanceof SessionExpiredError) {
            onSessionExpired()
            throw err
          }
          // Cada quadra grava em separado: as que já foram continuam com o preço novo. Diz quais, e deixa marcadas só as que faltam.
          const remaining = selected.slice(index)
          setSelected(remaining)
          if (done.length > 0) onApplied()
          const reason = err instanceof Error ? err.message : 'erro desconhecido'
          throw new Error(
            `${done.length > 0 ? `Já aplicado em: ${done.join(', ')}. ` : 'Nada foi aplicado. '}Falhou em ${courtName(courtId)} (${reason}). ${remaining.length > 1 ? 'Ficaram marcadas as quadras que faltam: ' : 'Tente de novo.'}${remaining.length > 1 ? remaining.map(courtName).join(', ') + '.' : ''}`,
          )
        }
      }
    })
    if (ok) {
      setConfirming(false)
      showToast(`Preços aplicados em ${selected.length} ${selected.length === 1 ? 'quadra' : 'quadras'}.`, 'success')
      onApplied()
    } else {
      setConfirming(false)
    }
  }

  async function applySafely() {
    try {
      await apply()
    } catch (err) {
      if (err instanceof SessionExpiredError) onSessionExpired()
    }
  }

  const nightLabel = nightStart <= open ? 'o dia todo' : `a partir das ${nightStart}h`

  const selectedCourts = courts.filter((court) => selected.includes(court.id))
  const changes = rules ? selectedCourts.map((court) => ({ court, change: buildCourtChange(court.priceRules, rules) })) : []
  const unchanged = courts.filter((court) => !selected.includes(court.id))
  const customCount = changes.filter(({ change }) => change.kind === 'replaces-custom').length

  return (
    <div className="panel-card price-simple">
      <div className="price-simple__grid">
        <label className="field">
          <span>Abre às</span>
          <select className="input" value={open} onChange={(event) => setOpen(Number(event.target.value))}>
            {HOURS.slice(0, 24).map((hour) => (
              <option key={hour} value={hour}>
                {hour}h
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Fecha às</span>
          <select className="input" value={close} onChange={(event) => setClose(Number(event.target.value))}>
            {HOURS.slice(1).map((hour) => (
              <option key={hour} value={hour}>
                {hour}h
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Preço da noite começa às</span>
          <select className="input" value={nightStart} onChange={(event) => setNightStart(Number(event.target.value))}>
            {HOURS.slice(0, 24).map((hour) => (
              <option key={hour} value={hour}>
                {hour}h
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="price-simple__grid">
        <label className="field">
          <span>Preço de dia (R$ por hora)</span>
          <input className="input" inputMode="decimal" placeholder="80" value={dayPrice} onChange={(event) => setDayPrice(event.target.value)} />
        </label>
        <label className="field">
          <span>Preço de noite (R$ por hora)</span>
          <input className="input" inputMode="decimal" placeholder="110" value={nightPrice} onChange={(event) => setNightPrice(event.target.value)} />
        </label>
        <div className="field">
          <span id="weekend-label">Sábado e domingo</span>
          <div className="chip-group" role="radiogroup" aria-labelledby="weekend-label">
            <ChipToggle type="radio" name="weekend" label="Mesmo preço" checked={weekendMode === 'same'} onChange={() => setWeekendMode('same')} />
            <ChipToggle type="radio" name="weekend" label="Acrescentar" checked={weekendMode === 'extra'} onChange={() => setWeekendMode('extra')} />
          </div>
          {weekendMode === 'extra' && (
            <input className="input" inputMode="decimal" placeholder="Acréscimo em R$ por hora" aria-label="Acréscimo por hora no fim de semana" value={weekendExtra} onChange={(event) => setWeekendExtra(event.target.value)} />
          )}
        </div>
      </div>

      <div className="price-simple__courts field">
        <span id="courts-label" className="price-simple__courts-head">
          Aplicar em
          <small>
            {selected.length} de {courts.length} {courts.length === 1 ? 'quadra' : 'quadras'}
          </small>
          {courts.length > 1 && (
            <span className="price-simple__courts-actions">
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setSelected(courts.map((court) => court.id))} disabled={selected.length === courts.length}>
                Todas
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setSelected([])} disabled={selected.length === 0}>
                Nenhuma
              </button>
            </span>
          )}
        </span>
        <div className="chip-group" role="group" aria-labelledby="courts-label">
          {courts.map((court) => (
            <ChipToggle key={court.id} label={court.name} checked={selected.includes(court.id)} onChange={(checked) => toggleCourt(court.id, checked)} />
          ))}
        </div>
      </div>

      {confirming ? (
        <>
          <div className="price-simple__summary" role="alert">
            <p>
              Isto vai <strong>substituir os preços atuais</strong> de {selected.length} {selected.length === 1 ? 'quadra' : 'quadras'} pelo modelo: das {open}h às {close}h, dia a R$ {dayPrice} e noite ({nightLabel}) a R$ {nightPrice}
              {weekendMode === 'extra' && weekendExtra ? `, com R$ ${weekendExtra} a mais no fim de semana` : ''}. Reservas que já existem não mudam.
            </p>
            <table className="price-simple__table">
              <caption className="sr-only">O que muda em cada quadra</caption>
              <thead>
                <tr>
                  <th scope="col">Quadra</th>
                  <th scope="col">Hoje</th>
                  <th scope="col">Depois</th>
                  <th scope="col">O que acontece</th>
                </tr>
              </thead>
              <tbody>
                {changes.map(({ court, change }) => (
                  <tr key={court.id} className={change.kind === 'replaces-custom' ? 'price-simple__row--warn' : undefined}>
                    <th scope="row">{court.name}</th>
                    <td>{change.before.text}</td>
                    <td>{change.after.text}</td>
                    <td>{CHANGE_LABEL[change.kind]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {unchanged.length > 0 && (
              <p className="price-simple__note">
                Não mudam: {unchanged.map((court) => court.name).join(', ')}.
              </p>
            )}
            {customCount > 0 && (
              <p className="price-simple__note price-simple__note--warn">
                ⚠ {customCount} {customCount === 1 ? 'quadra tem' : 'quadras têm'} preços personalizados por dia e hora, que serão trocados por este modelo. Se não quiser, volte e desmarque {customCount === 1 ? 'essa quadra' : 'essas quadras'}.
              </p>
            )}
          </div>
          <div className="price-simple__actions">
            <button type="button" className="btn btn--primary" onClick={applySafely} disabled={state === 'saving'}>
              Confirmar e aplicar
            </button>
            <button type="button" className="btn btn--outline" onClick={() => setConfirming(false)} disabled={state === 'saving'}>
              Voltar
            </button>
            <SaveStatus state={state} message={message} />
          </div>
        </>
      ) : (
        <div className="price-simple__actions">
          <button type="button" className="btn btn--primary" onClick={review}>
            Aplicar preços
          </button>
          {first && (
            <Link to={`/painel/quadras/${first.id}/precos`} className="btn btn--ghost btn--sm">
              Personalizar por dia e hora
            </Link>
          )}
          <SaveStatus state={state} message={message} />
          {error && <span className="setting-row__error" role="alert">{error}</span>}
        </div>
      )}
    </div>
  )
}
