import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useEscapeToClose } from '../../hooks/useEscapeToClose'
import { SessionExpiredError } from '../../lib/api'
import type { PriceRule } from '../../lib/courts'
import { createReservation } from '../../lib/reservations'
import { fetchInstructors } from '../../lib/instructors'
import type { Instructor } from '../../lib/instructors'
import { validateCouponForCourt } from '../../lib/coupons'
import type { CouponPreview } from '../../lib/coupons'
import { fetchActiveEquipmentForCourt } from '../../lib/equipment'
import type { Equipment } from '../../lib/equipment'
import { formatMinutes } from '../../lib/weekGrid'
import './ReservationModal.css'

interface ReservationModalProps {
  courtId: string
  dayDate: Date
  dayOfWeek: number
  startMinute: number
  endOptions: number[]
  priceRules: PriceRule[]
  onClose: () => void
  onCreated: () => void
  onSessionExpired: () => void
}

function calcPrice(dayOfWeek: number, startMinute: number, endMinute: number, priceRules: PriceRule[]) {
  const dayRules = priceRules.filter((r) => r.dayOfWeek === dayOfWeek).sort((a, b) => a.startMinute - b.startMinute)
  let cursor = startMinute
  let total = 0
  while (cursor < endMinute) {
    const rule = dayRules.find((r) => r.startMinute === cursor)
    if (!rule) break
    const segmentEnd = Math.min(rule.endMinute, endMinute)
    total += Number(rule.pricePerHour) * ((segmentEnd - cursor) / 60)
    cursor = rule.endMinute
  }
  return total
}

function toISOAt(dayDate: Date, minutes: number) {
  const date = new Date(dayDate)
  date.setHours(0, minutes, 0, 0)
  return date.toISOString()
}

export default function ReservationModal({
  courtId,
  dayDate,
  dayOfWeek,
  startMinute,
  endOptions,
  priceRules,
  onClose,
  onCreated,
  onSessionExpired,
}: ReservationModalProps) {
  useEscapeToClose(onClose)
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [endMinute, setEndMinute] = useState(endOptions[0])
  const [instructorId, setInstructorId] = useState('')
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [couponCode, setCouponCode] = useState('')
  const [couponPreview, setCouponPreview] = useState<CouponPreview | null>(null)
  const [couponError, setCouponError] = useState('')
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([])
  const [equipmentQuantities, setEquipmentQuantities] = useState<Record<string, number>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchInstructors()
      .then((all) => setInstructors(all.filter((i) => i.active)))
      .catch(() => {
        // seletor de instrutor é auxiliar — uma falha aqui não deve travar a criação da reserva
      })
    fetchActiveEquipmentForCourt(courtId)
      .then(setEquipmentList)
      .catch(() => {
        // seletor de equipamento é auxiliar — uma falha aqui não deve travar a criação da reserva
      })
  }, [courtId])

  const price = calcPrice(dayOfWeek, startMinute, endMinute, priceRules)
  const discount = couponPreview
    ? Math.min(
        couponPreview.discountType === 'PERCENT' ? (price * couponPreview.discountValue) / 100 : couponPreview.discountValue,
        price,
      )
    : 0
  const equipmentTotal = equipmentList.reduce(
    (sum, item) => sum + (equipmentQuantities[item.id] ?? 0) * item.pricePerUnit,
    0,
  )
  const finalPrice = price - discount + equipmentTotal

  function setEquipmentQuantity(id: string, quantity: number) {
    setEquipmentQuantities((prev) => ({ ...prev, [id]: Math.max(0, quantity) }))
  }

  async function handleApplyCoupon() {
    setCouponError('')
    setCouponPreview(null)
    if (!couponCode.trim()) return
    setIsValidatingCoupon(true)
    try {
      const preview = await validateCouponForCourt(courtId, couponCode.trim())
      setCouponPreview(preview)
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : 'Cupom inválido')
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSaving(true)
    setError('')

    try {
      await createReservation(courtId, {
        guestName,
        guestPhone,
        startsAt: toISOAt(dayDate, startMinute),
        endsAt: toISOAt(dayDate, endMinute),
        instructorId: instructorId || undefined,
        couponCode: couponPreview ? couponCode.trim() : undefined,
        equipmentItems: Object.entries(equipmentQuantities)
          .filter(([, quantity]) => quantity > 0)
          .map(([equipmentId, quantity]) => ({ equipmentId, quantity })),
      })
      onCreated()
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
        return
      }
      setError(err instanceof Error ? err.message : 'Não foi possível criar a reserva')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="reservation-modal__overlay" onClick={onClose}>
      <div className="reservation-modal" onClick={(event) => event.stopPropagation()}>
        <button className="reservation-modal__close" onClick={onClose} aria-label="Fechar">
          ×
        </button>

        <h2>Nova reserva</h2>
        <p className="reservation-modal__slot">
          {formatMinutes(startMinute)} – {formatMinutes(endMinute)}
        </p>

        <form onSubmit={handleSubmit} className="reservation-modal__form">
          <label className="reservation-modal__field">
            <span>Nome do cliente</span>
            <input value={guestName} onChange={(e) => setGuestName(e.target.value)} required minLength={2} />
          </label>

          <label className="reservation-modal__field">
            <span>Telefone</span>
            <input
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              required
              minLength={8}
              placeholder="(85) 99999-9999"
            />
          </label>

          <label className="reservation-modal__field">
            <span>Duração</span>
            <select value={endMinute} onChange={(e) => setEndMinute(Number(e.target.value))}>
              {endOptions.map((option) => (
                <option key={option} value={option}>
                  até {formatMinutes(option)}
                </option>
              ))}
            </select>
          </label>

          {instructors.length > 0 && (
            <label className="reservation-modal__field">
              <span>Instrutor (opcional)</span>
              <select value={instructorId} onChange={(e) => setInstructorId(e.target.value)}>
                <option value="">Sem instrutor</option>
                {instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="reservation-modal__field">
            <span>Cupom (opcional)</span>
            <div className="reservation-modal__coupon-row">
              <input
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase())
                  setCouponPreview(null)
                  setCouponError('')
                }}
                placeholder="PROMO10"
              />
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={handleApplyCoupon}
                disabled={!couponCode.trim() || isValidatingCoupon}
              >
                {isValidatingCoupon ? 'Validando...' : 'Aplicar'}
              </button>
            </div>
          </label>

          {couponError && <p className="reservation-modal__error">{couponError}</p>}
          {couponPreview && (
            <p className="reservation-modal__coupon-applied">
              Cupom {couponPreview.code} aplicado — desconto de R$ {discount.toFixed(2).replace('.', ',')}
            </p>
          )}

          {equipmentList.length > 0 && (
            <div className="reservation-modal__field">
              <span>Equipamento (opcional)</span>
              <div className="reservation-modal__equipment-list">
                {equipmentList.map((item) => (
                  <div key={item.id} className="reservation-modal__equipment-item">
                    <span>
                      {item.name} <small>R$ {item.pricePerUnit.toFixed(2).replace('.', ',')}</small>
                    </span>
                    <div className="reservation-modal__equipment-stepper">
                      <button
                        type="button"
                        onClick={() => setEquipmentQuantity(item.id, (equipmentQuantities[item.id] ?? 0) - 1)}
                        disabled={(equipmentQuantities[item.id] ?? 0) === 0}
                      >
                        −
                      </button>
                      <span>{equipmentQuantities[item.id] ?? 0}</span>
                      <button
                        type="button"
                        onClick={() => setEquipmentQuantity(item.id, (equipmentQuantities[item.id] ?? 0) + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="reservation-modal__price">
            {couponPreview || equipmentTotal > 0 ? (
              <>
                <span className="reservation-modal__price-original">R$ {price.toFixed(2).replace('.', ',')}</span>
                {' '}Total: <strong>R$ {finalPrice.toFixed(2).replace('.', ',')}</strong>
              </>
            ) : (
              <>
                Total: <strong>R$ {price.toFixed(2).replace('.', ',')}</strong>
              </>
            )}
          </p>

          {error && <p className="reservation-modal__error">{error}</p>}

          <button type="submit" className="reservation-modal__submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Confirmar reserva'}
          </button>
        </form>
      </div>
    </div>
  )
}
