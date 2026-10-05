import { useEffect, useState } from 'react'
import { useEscapeToClose } from '../../hooks/useEscapeToClose'
import { createPlayerReservation, getPlayerUser, validatePublicCoupon } from '../../lib/player'
import type { CouponPreview } from '../../lib/player'
import { fetchActiveEquipmentForCourt } from '../../lib/equipment'
import type { Equipment } from '../../lib/equipment'
import { formatMinutes } from '../../lib/weekGrid'
import { shareOrCopy } from '../../lib/share'
import type { ShareResult } from '../../lib/share'
import { buildGoogleCalendarUrl } from '../../lib/calendar'
import { showToast } from '../../lib/toast'
import { CANCELLATION_POLICY } from '../../lib/policy'
import PlayerLoginForm from './PlayerLoginForm'
import ReceiptModal from './ReceiptModal'
import './BookingFlowModal.css'

type Step = 'confirm' | 'login' | 'success'

interface BookingFlowModalProps {
  courtId: string
  courtName: string
  establishmentName?: string | null
  photoUrl?: string | null
  sportLabel?: string
  slug: string
  dayLabel: string
  dayDate: Date
  startMinute: number
  endMinute: number
  price: number
  onClose: () => void
  onBooked: () => void
}

function toISOAt(dayDate: Date, minutes: number) {
  const date = new Date(dayDate)
  date.setHours(0, minutes, 0, 0)
  return date.toISOString()
}

function money(value: number) {
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

export default function BookingFlowModal({
  courtId,
  courtName,
  establishmentName,
  photoUrl,
  sportLabel,
  slug,
  dayLabel,
  dayDate,
  startMinute,
  endMinute,
  price,
  onClose,
  onBooked,
}: BookingFlowModalProps) {
  useEscapeToClose(onClose)
  const existingPlayer = getPlayerUser()
  const [step, setStep] = useState<Step>(existingPlayer ? 'confirm' : 'login')
  const [couponCode, setCouponCode] = useState('')
  const [couponPreview, setCouponPreview] = useState<CouponPreview | null>(null)
  const [couponError, setCouponError] = useState('')
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([])
  const [equipmentQuantities, setEquipmentQuantities] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [shareResult, setShareResult] = useState<ShareResult | null>(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [bookingCode, setBookingCode] = useState('')

  useEffect(() => {
    fetchActiveEquipmentForCourt(courtId)
      .then(setEquipmentList)
      .catch(() => {
        // seletor de equipamento é auxiliar — uma falha aqui não deve travar a reserva
      })
  }, [courtId])

  const discount = couponPreview
    ? Math.min(
        couponPreview.discountType === 'PERCENT' ? (price * couponPreview.discountValue) / 100 : couponPreview.discountValue,
        price,
      )
    : 0
  const equipmentLines = equipmentList
    .filter((item) => (equipmentQuantities[item.id] ?? 0) > 0)
    .map((item) => {
      const quantity = equipmentQuantities[item.id] ?? 0
      return { id: item.id, label: `${quantity}× ${item.name}`, amount: quantity * item.pricePerUnit }
    })
  const equipmentTotal = equipmentLines.reduce((sum, line) => sum + line.amount, 0)
  const finalPrice = price - discount + equipmentTotal

  function setEquipmentQuantity(id: string, quantity: number) {
    setEquipmentQuantities((prev) => ({ ...prev, [id]: Math.max(0, quantity) }))
  }

  async function handleInvite() {
    const result = await shareOrCopy({
      title: courtName,
      text: `Bora jogar? Reservei ${courtName} pra ${dayLabel} às ${formatMinutes(startMinute)}.`,
      url: `${window.location.origin}/${slug}/${courtId}`,
    })
    setShareResult(result)
  }

  async function handleApplyCoupon() {
    setCouponError('')
    setCouponPreview(null)
    if (!couponCode.trim()) return
    setIsValidatingCoupon(true)
    try {
      const preview = await validatePublicCoupon(courtId, couponCode.trim())
      setCouponPreview(preview)
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : 'Cupom inválido')
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  async function handleConfirm() {
    setIsLoading(true)
    try {
      const reservation = await createPlayerReservation(courtId, {
        startsAt: toISOAt(dayDate, startMinute),
        endsAt: toISOAt(dayDate, endMinute),
        couponCode: couponPreview ? couponCode.trim() : undefined,
        equipmentItems: Object.entries(equipmentQuantities)
          .filter(([, quantity]) => quantity > 0)
          .map(([equipmentId, quantity]) => ({ equipmentId, quantity })),
      })
      setBookingCode(reservation.id.slice(0, 8).toUpperCase())
      setStep('success')
      onBooked()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Não foi possível confirmar a reserva', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const timeLabel = `${formatMinutes(startMinute)} – ${formatMinutes(endMinute)}`

  const priceBreakdown = (
    <dl className="booking-modal__rows">
      <div className="booking-modal__row">
        <dt>Quadra</dt>
        <dd>{money(price)}</dd>
      </div>
      {equipmentLines.map((line) => (
        <div key={line.id} className="booking-modal__row">
          <dt>{line.label}</dt>
          <dd>{money(line.amount)}</dd>
        </div>
      ))}
      {couponPreview && discount > 0 && (
        <div className="booking-modal__row booking-modal__row--discount">
          <dt>Cupom {couponPreview.code}</dt>
          <dd>− {money(discount)}</dd>
        </div>
      )}
      <div className="booking-modal__row booking-modal__row--total">
        <dt>Total</dt>
        <dd>{money(finalPrice)}</dd>
      </div>
    </dl>
  )

  return (
    <div className="booking-modal__overlay booking-modal__overlay--sheet" onClick={onClose}>
      <div
        className="booking-modal booking-modal--sheet"
        role="dialog"
        aria-modal="true"
        aria-label={step === 'success' ? 'Reserva confirmada' : 'Confirmar reserva'}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="booking-modal__topbar">
          <button type="button" className="booking-modal__back" onClick={onClose} aria-label="Voltar">
            ←
          </button>
          <span>{step === 'success' ? 'Reserva confirmada' : 'Confirmar reserva'}</span>
        </div>

        <button className="booking-modal__close" onClick={onClose} aria-label="Fechar">
          ×
        </button>

        {step !== 'success' && (
          <>
            <div className="booking-modal__summary">
              <div className="booking-modal__thumb">
                {photoUrl && <img src={photoUrl} alt="" />}
              </div>
              <div className="booking-modal__summary-info">
                <h2>{courtName}</h2>
                {establishmentName && <p className="booking-modal__establishment">{establishmentName}</p>}
                <span className="booking-modal__summary-when">
                  {dayLabel} · {timeLabel}
                </span>
                <strong className="booking-modal__summary-price">{money(finalPrice)}</strong>
              </div>
            </div>

            <section className="booking-modal__section">
              <h3>Sua reserva</h3>
              <dl className="booking-modal__rows">
                <div className="booking-modal__row">
                  <dt>Data</dt>
                  <dd>{dayLabel}</dd>
                  <button type="button" className="booking-modal__link" onClick={onClose}>
                    Editar
                  </button>
                </div>
                <div className="booking-modal__row">
                  <dt>Horário</dt>
                  <dd>{timeLabel}</dd>
                  <button type="button" className="booking-modal__link" onClick={onClose}>
                    Editar
                  </button>
                </div>
                {sportLabel && (
                  <div className="booking-modal__row">
                    <dt>Esporte</dt>
                    <dd>{sportLabel}</dd>
                  </div>
                )}
              </dl>
            </section>

            <section className="booking-modal__section">
              <h3>Cupom</h3>
              <div className="booking-modal__coupon">
                <div className="booking-modal__coupon-row">
                  <input
                    className="input"
                    value={couponCode}
                    onChange={(event) => {
                      setCouponCode(event.target.value.toUpperCase())
                      setCouponPreview(null)
                      setCouponError('')
                    }}
                    placeholder="Código do cupom (opcional)"
                  />
                  <button
                    type="button"
                    className="booking-modal__coupon-apply"
                    onClick={handleApplyCoupon}
                    disabled={!couponCode.trim() || isValidatingCoupon}
                  >
                    {isValidatingCoupon ? 'Validando...' : 'Aplicar'}
                  </button>
                </div>
                {couponError && <p className="booking-modal__coupon-error">{couponError}</p>}
                {couponPreview && (
                  <p className="booking-modal__coupon-applied">
                    Cupom {couponPreview.code} aplicado — desconto de {money(discount)}
                  </p>
                )}
              </div>
            </section>

            {equipmentList.length > 0 && (
              <section className="booking-modal__section">
                <h3>Equipamentos</h3>
                <div className="booking-modal__equipment">
                  {equipmentList.map((item) => (
                    <div key={item.id} className="booking-modal__equipment-item">
                      <span>
                        {item.name} <small>{money(item.pricePerUnit)}</small>
                      </span>
                      <div className="booking-modal__equipment-stepper">
                        <button
                          type="button"
                          onClick={() => setEquipmentQuantity(item.id, (equipmentQuantities[item.id] ?? 0) - 1)}
                          disabled={(equipmentQuantities[item.id] ?? 0) === 0}
                          aria-label={`Menos ${item.name}`}
                        >
                          −
                        </button>
                        <span>{equipmentQuantities[item.id] ?? 0}</span>
                        <button
                          type="button"
                          onClick={() => setEquipmentQuantity(item.id, (equipmentQuantities[item.id] ?? 0) + 1)}
                          aria-label={`Mais ${item.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="booking-modal__section">
              <h3>Detalhes do preço</h3>
              {priceBreakdown}
            </section>

            <section className="booking-modal__section">
              <h3>Cancelamento</h3>
              <p className="booking-modal__policy">{CANCELLATION_POLICY}</p>
            </section>

            {step === 'confirm' && (
              <div className="booking-modal__cta">
                <button type="button" className="btn btn--primary btn--full" disabled={isLoading} onClick={handleConfirm}>
                  {isLoading ? 'Confirmando...' : `Confirmar reserva · ${money(finalPrice)}`}
                </button>
              </div>
            )}

            {step === 'login' && (
              <PlayerLoginForm
                hint="Digite seu nome e telefone pra confirmar a reserva."
                submitLabel="Confirmar e reservar"
                onSuccess={handleConfirm}
              />
            )}
          </>
        )}

        {step === 'success' && (
          <>
            <div className="booking-modal__celebration">
              <span className="booking-modal__check" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <h2>Reserva confirmada!</h2>
              <p className="booking-modal__establishment">
                {courtName}
                {establishmentName ? ` · ${establishmentName}` : ''}
              </p>
              {bookingCode && <span className="pill pill--info">Reserva #{bookingCode}</span>}
            </div>

            <section className="booking-modal__section">
              <h3>Sua reserva</h3>
              <dl className="booking-modal__rows">
                <div className="booking-modal__row">
                  <dt>Data</dt>
                  <dd>{dayLabel}</dd>
                </div>
                <div className="booking-modal__row">
                  <dt>Horário</dt>
                  <dd>{timeLabel}</dd>
                </div>
              </dl>
            </section>

            <section className="booking-modal__section">
              <h3>Resumo do pagamento</h3>
              {priceBreakdown}
            </section>

            <div className="booking-modal__actions">
              <button type="button" className="btn btn--primary btn--full" onClick={handleInvite}>
                Convidar pra jogar
              </button>
              {shareResult === 'copied' && (
                <p className="booking-modal__hint">Link copiado! Cole numa conversa pra convidar.</p>
              )}
              {shareResult === 'failed' && (
                <p className="booking-modal__hint">Não deu pra compartilhar automaticamente — copie o link da barra de endereço.</p>
              )}
              <a
                className="btn btn--outline btn--full"
                href={buildGoogleCalendarUrl({
                  title: courtName,
                  details: `Reserva no Jogaê Sports — ${courtName}`,
                  startsAt: toISOAt(dayDate, startMinute),
                  endsAt: toISOAt(dayDate, endMinute),
                })}
                target="_blank"
                rel="noreferrer"
              >
                Adicionar ao Google Calendar
              </a>
              <button type="button" className="btn btn--outline btn--full" onClick={() => setShowReceipt(true)}>
                Ver comprovante
              </button>
              <button type="button" className="btn btn--ghost btn--full" onClick={onClose}>
                Fechar
              </button>
            </div>
          </>
        )}
      </div>

      {showReceipt && (
        <ReceiptModal
          courtName={courtName}
          establishmentName={establishmentName ?? null}
          dateLabel={`${dayLabel} · ${formatMinutes(startMinute)}–${formatMinutes(endMinute)}`}
          price={finalPrice}
          shareUrl={`${window.location.origin}/${slug}/${courtId}`}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  )
}
