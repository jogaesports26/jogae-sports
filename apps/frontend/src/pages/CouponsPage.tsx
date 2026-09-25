import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { usePainelContext } from '../components/panel/PainelLayout'
import { SessionExpiredError } from '../lib/api'
import { createCoupon, fetchCoupons, removeCoupon, updateCoupon } from '../lib/coupons'
import type { Coupon, CouponDiscountType } from '../lib/coupons'
import './CouponsPage.css'

function formatDiscount(coupon: Coupon): string {
  return coupon.discountType === 'PERCENT' ? `${coupon.discountValue}%` : `R$ ${coupon.discountValue.toFixed(2)}`
}

function formatUsage(coupon: Coupon): string {
  return coupon.usageLimit ? `${coupon.usageCount}/${coupon.usageLimit} usos` : `${coupon.usageCount} usos`
}

function isExpired(coupon: Coupon): boolean {
  return Boolean(coupon.validUntil && new Date(coupon.validUntil) < new Date())
}

export default function CouponsPage() {
  const { onSessionExpired } = usePainelContext()
  const [coupons, setCoupons] = useState<Coupon[] | null>(null)
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<CouponDiscountType>('PERCENT')
  const [discountValue, setDiscountValue] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [usageLimit, setUsageLimit] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValidUntil, setEditValidUntil] = useState('')
  const [editUsageLimit, setEditUsageLimit] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  function load() {
    fetchCoupons()
      .then(setCoupons)
      .catch((err) => {
        if (err instanceof SessionExpiredError) {
          onSessionExpired()
          return
        }
        setError(err instanceof Error ? err.message : 'Erro ao carregar os cupons')
      })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleAdd(event: FormEvent) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    try {
      await createCoupon({
        code,
        discountType,
        discountValue: Number(discountValue),
        validUntil: validUntil || undefined,
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
      })
      setCode('')
      setDiscountValue('')
      setValidUntil('')
      setUsageLimit('')
      load()
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
        return
      }
      setError(err instanceof Error ? err.message : 'Não foi possível criar o cupom')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleActive(coupon: Coupon) {
    try {
      const updated = await updateCoupon(coupon.id, { active: !coupon.active })
      setCoupons((prev) => (prev ? prev.map((c) => (c.id === updated.id ? updated : c)) : prev))
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
      }
    }
  }

  function startEdit(coupon: Coupon) {
    setEditingId(coupon.id)
    setEditValidUntil(coupon.validUntil ? coupon.validUntil.slice(0, 10) : '')
    setEditUsageLimit(coupon.usageLimit ? String(coupon.usageLimit) : '')
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function handleSaveEdit(id: string) {
    setIsSavingEdit(true)
    setError('')
    try {
      const updated = await updateCoupon(id, {
        validUntil: editValidUntil || undefined,
        usageLimit: editUsageLimit ? Number(editUsageLimit) : undefined,
      })
      setCoupons((prev) => (prev ? prev.map((c) => (c.id === updated.id ? updated : c)) : prev))
      setEditingId(null)
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
        return
      }
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o cupom')
    } finally {
      setIsSavingEdit(false)
    }
  }

  async function handleRemove(id: string) {
    try {
      await removeCoupon(id)
      setCoupons((prev) => (prev ? prev.filter((c) => c.id !== id) : prev))
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
        return
      }
      setError(err instanceof Error ? err.message : 'Não foi possível remover o cupom')
    }
  }

  return (
    <div className="coupons-page">
      <h1>Cupons</h1>
      <p className="coupons-page__subtitle">
        Crie códigos de desconto pra usar no lançamento manual de reservas ou pros jogadores aplicarem na hora de reservar.
      </p>

      {error && <p className="coupons-page__error">{error}</p>}

      {!error && coupons === null && <p className="coupons-page__loading">Carregando...</p>}

      {coupons !== null && (
        <div className="coupons-page__layout">
          <form className="coupons-page__form card" onSubmit={handleAdd}>
            <h2>Novo cupom</h2>
            <label className="coupons-page__field">
              <span>Código</span>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="PROMO10"
                required
                minLength={3}
                maxLength={20}
                pattern="[A-Za-z0-9]+"
              />
            </label>
            <label className="coupons-page__field">
              <span>Tipo de desconto</span>
              <select value={discountType} onChange={(event) => setDiscountType(event.target.value as CouponDiscountType)}>
                <option value="PERCENT">Percentual (%)</option>
                <option value="FIXED">Valor fixo (R$)</option>
              </select>
            </label>
            <label className="coupons-page__field">
              <span>{discountType === 'PERCENT' ? 'Desconto (%)' : 'Desconto (R$)'}</span>
              <input
                type="number"
                min={0.01}
                max={discountType === 'PERCENT' ? 100 : undefined}
                step="0.01"
                value={discountValue}
                onChange={(event) => setDiscountValue(event.target.value)}
                placeholder={discountType === 'PERCENT' ? '10' : '20.00'}
                required
              />
            </label>
            <label className="coupons-page__field">
              <span>Válido até (opcional)</span>
              <input type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} />
            </label>
            <label className="coupons-page__field">
              <span>Limite de usos (opcional)</span>
              <input
                type="number"
                min={1}
                step="1"
                value={usageLimit}
                onChange={(event) => setUsageLimit(event.target.value)}
                placeholder="Sem limite"
              />
            </label>
            <button type="submit" className="btn btn--primary btn--full" disabled={isSaving}>
              {isSaving ? 'Criando...' : '+ Criar cupom'}
            </button>
          </form>

          {coupons.length === 0 ? (
            <div className="coupons-page__empty card">
              <p>Nenhum cupom criado ainda.</p>
              <span>Depois de criar, o código pode ser usado ao lançar uma reserva ou pelos jogadores na reserva pelo portal.</span>
            </div>
          ) : (
            <div className="coupons-page__list">
              {coupons.map((coupon) => {
                const expired = isExpired(coupon)
                return (
                  <div key={coupon.id} className="coupons-page__item">
                    <div className="coupons-page__item-header">
                      <span className="coupons-page__code">{coupon.code}</span>
                      <span
                        className={`pill ${expired ? 'pill--warning' : coupon.active ? 'pill--positive' : 'pill--neutral'}`}
                      >
                        {expired ? 'Expirado' : coupon.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <div className="coupons-page__item-body">
                      <strong>{formatDiscount(coupon)}</strong>
                      <small>{formatUsage(coupon)}</small>
                      {coupon.validUntil && (
                        <small>Até {new Date(coupon.validUntil).toLocaleDateString('pt-BR')}</small>
                      )}
                    </div>

                    {editingId === coupon.id ? (
                      <div className="coupons-page__edit">
                        <label className="coupons-page__field">
                          <span>Válido até</span>
                          <input
                            type="date"
                            value={editValidUntil}
                            onChange={(event) => setEditValidUntil(event.target.value)}
                          />
                        </label>
                        <label className="coupons-page__field">
                          <span>Limite de usos</span>
                          <input
                            type="number"
                            min={1}
                            step="1"
                            value={editUsageLimit}
                            onChange={(event) => setEditUsageLimit(event.target.value)}
                            placeholder="Sem limite"
                          />
                        </label>
                        <div className="coupons-page__item-actions">
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={cancelEdit}
                            disabled={isSavingEdit}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            className="btn btn--primary btn--sm"
                            onClick={() => handleSaveEdit(coupon.id)}
                            disabled={isSavingEdit}
                          >
                            {isSavingEdit ? 'Salvando...' : 'Salvar'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="coupons-page__item-actions">
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => startEdit(coupon)}>
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => handleToggleActive(coupon)}
                        >
                          {coupon.active ? 'Desativar' : 'Ativar'}
                        </button>
                        <button
                          type="button"
                          className="coupons-page__remove"
                          onClick={() => handleRemove(coupon.id)}
                          aria-label="Remover cupom"
                          disabled={coupon.usageCount > 0}
                          title={coupon.usageCount > 0 ? 'Cupons já usados só podem ser desativados' : 'Remover cupom'}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
