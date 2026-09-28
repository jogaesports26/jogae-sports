import { useState } from 'react'
import type { FormEvent } from 'react'
import { getPlayerUser, requestOtp, savePlayerSession, updatePlayerName, verifyOtp } from '../../lib/player'
import type { PlayerUser } from '../../lib/player'
import { FORMATTED_PHONE_MIN_LENGTH, formatPhone, phoneDigits } from '../../lib/phone'
import './BookingFlowModal.css'

interface PlayerLoginFormProps {
  hint?: string
  submitLabel?: string
  onSuccess: (player: PlayerUser) => void
}

export default function PlayerLoginForm({ hint, submitLabel, onSuccess }: PlayerLoginFormProps) {
  const [step, setStep] = useState<'form' | 'code'>('form')
  const [name, setName] = useState(() => getPlayerUser()?.name ?? '')
  const [phone, setPhone] = useState(() => phoneDigits(getPlayerUser()?.phone ?? ''))
  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRequestOtp(event: FormEvent) {
    event.preventDefault()
    setError('')
    setIsLoading(true)
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
    setError('')
    setIsLoading(true)
    try {
      const result = await verifyOtp(phone, code)
      savePlayerSession(result.accessToken, result.player)

      const trimmedName = name.trim()
      if (trimmedName.length >= 2) {
        try {
          const updatedPlayer = await updatePlayerName(trimmedName)
          savePlayerSession(result.accessToken, updatedPlayer)
          onSuccess(updatedPlayer)
          return
        } catch {
          // salvar o nome é secundário — o login em si já funcionou, então segue com ele
        }
      }
      onSuccess(result.player)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código inválido')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {error && <p className="booking-modal__error">{error}</p>}

      {step === 'form' && (
        <form className="booking-modal__form" onSubmit={handleRequestOtp}>
          {hint && <p className="booking-modal__hint">{hint}</p>}
          <label className="booking-modal__field">
            <span>Nome</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Seu nome"
              required
              minLength={2}
            />
          </label>
          <label className="booking-modal__field">
            <span>Telefone</span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={formatPhone(phone)}
              onChange={(event) => setPhone(phoneDigits(event.target.value))}
              placeholder="(85) 99999-9999"
              required
              minLength={FORMATTED_PHONE_MIN_LENGTH}
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
              autoFocus
            />
          </label>
          <button type="submit" className="booking-modal__submit" disabled={isLoading}>
            {isLoading ? 'Confirmando...' : submitLabel ?? 'Entrar'}
          </button>
        </form>
      )}
    </>
  )
}
