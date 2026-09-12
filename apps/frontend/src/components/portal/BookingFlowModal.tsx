import { useState } from 'react'
import type { FormEvent } from 'react'
import { useEscapeToClose } from '../../hooks/useEscapeToClose'
import {
  createPlayerReservation,
  getPlayerUser,
  requestOtp,
  savePlayerSession,
  validatePublicCoupon,
  verifyOtp,
} from '../../lib/player'
import type { CouponPreview } from '../../lib/player'
import { formatMinutes } from '../../lib/weekGrid'
import './BookingFlowModal.css'

type Step = 'confirm' | 'phone' | 'code' | 'success'

interface BookingFlowModalProps {
  courtId: string
  courtName: string
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

export default function BookingFlowModal({
  courtId,
  courtName,
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
  const [step, setStep] = useState<Step>(existingPlayer ? 'confirm' : 'phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponPreview, setCouponPreview] = useState<CouponPreview | null>(null)
  const [couponError, setCouponError] = useState('')
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const discount = couponPreview
    ? Math.min(
        couponPreview.discountType === 'PERCENT' ? (price * couponPreview.discountValue) / 100 : couponPreview.discountValue,
        price,
      )
    : 0
  const finalPrice = price - discount

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

  async function handleRequestOtp(event: FormEvent) {
    event.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const result = await requestOtp(phone)
      setDevCode(result.devCode)
      setStep('code')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar o código')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleVerifyOtp(event: FormEvent) {
    event.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const result = await verifyOtp(phone, code)
      savePlayerSession(result.accessToken, result.player)
      await handleConfirm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código inválido')
      setIsLoading(false)
    }
  }

  async function handleConfirm() {
    setIsLoading(true)
    setError('')
    try {
      await createPlayerReservation(courtId, {
        startsAt: toISOAt(dayDate, startMinute),
        endsAt: toISOAt(dayDate, endMinute),
        couponCode: couponPreview ? couponCode.trim() : undefined,
      })
      setStep('success')
      onBooked()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível confirmar a reserva')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="booking-modal__overlay" onClick={onClose}>
      <div className="booking-modal" onClick={(event) => event.stopPropagation()}>
        <button className="booking-modal__close" onClick={onClose} aria-label="Fechar">
          ×
        </button>

        <h2>{courtName}</h2>
        <p className="booking-modal__slot">
          {dayLabel} · {formatMinutes(startMinute)} – {formatMinutes(endMinute)}
        </p>
        {step !== 'success' && (
          <div className="booking-modal__coupon">
            <div className="booking-modal__coupon-row">
              <input
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
                Cupom {couponPreview.code} aplicado — desconto de R$ {discount.toFixed(2).replace('.', ',')}
              </p>
            )}
          </div>
        )}

        <p className="booking-modal__price">
          {couponPreview ? (
            <>
              <span className="booking-modal__price-original">R$ {price.toFixed(2).replace('.', ',')}</span>{' '}
              R$ {finalPrice.toFixed(2).replace('.', ',')}
            </>
          ) : (
            <>R$ {price.toFixed(2).replace('.', ',')}</>
          )}
        </p>

        {error && <p className="booking-modal__error">{error}</p>}

        {step === 'confirm' && (
          <div className="booking-modal__form">
            <p className="booking-modal__hint">Confirmar reserva com seus dados salvos?</p>
            <button className="booking-modal__submit" disabled={isLoading} onClick={handleConfirm}>
              {isLoading ? 'Confirmando...' : 'Confirmar reserva'}
            </button>
          </div>
        )}

        {step === 'phone' && (
          <form className="booking-modal__form" onSubmit={handleRequestOtp}>
            <p className="booking-modal__hint">
              Digite seu WhatsApp/telefone pra receber um código e confirmar a reserva.
            </p>
            <label className="booking-modal__field">
              <span>Telefone</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="(85) 99999-9999"
                required
                minLength={8}
              />
            </label>
            <button type="submit" className="booking-modal__submit" disabled={isLoading}>
              {isLoading ? 'Enviando...' : 'Enviar código'}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form className="booking-modal__form" onSubmit={handleVerifyOtp}>
            <p className="booking-modal__hint">
              Digite o código enviado pro seu telefone.
              {devCode && (
                <>
                  {' '}
                  <strong>(ambiente de teste, código: {devCode})</strong>
                </>
              )}
            </p>
            <label className="booking-modal__field">
              <span>Código de 6 dígitos</span>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                required
                minLength={6}
                maxLength={6}
              />
            </label>
            <button type="submit" className="booking-modal__submit" disabled={isLoading}>
              {isLoading ? 'Confirmando...' : 'Confirmar e reservar'}
            </button>
          </form>
        )}

        {step === 'success' && (
          <div className="booking-modal__form">
            <p className="booking-modal__success">Reserva confirmada! Você já pode fechar esta janela.</p>
            <button className="booking-modal__submit" onClick={onClose}>
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
