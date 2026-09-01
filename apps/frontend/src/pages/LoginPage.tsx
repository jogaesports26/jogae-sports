import { useState, type FormEvent } from 'react'
import './LoginPage.css'
import DeviceMockup from './DeviceMockup'

const API_URL = import.meta.env.VITE_API_URL ?? 'https://jogae-sports-backend.onrender.com'

interface FormErrors {
  email?: string
  password?: string
}

function validate(email: string, password: string): FormErrors {
  const errors: FormErrors = {}

  if (!email.trim()) {
    errors.email = 'Informe seu e-mail'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'E-mail inválido'
  }

  if (!password) {
    errors.password = 'Informe sua senha'
  } else if (password.length < 6) {
    errors.password = 'A senha deve ter pelo menos 6 caracteres'
  }

  return errors
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const errors = validate(email, password)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.message ?? 'E-mail ou senha inválidos')
      }

      // TODO: guardar token e redirecionar quando o fluxo de sessão existir
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Não foi possível fazer login')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__panel login-page__panel--form">
        <div className="login-page__form">
          <div className="login-page__brand">Jogaê Sports - Gestão</div>

          <h1>Bem-vindo de volta</h1>
          <p className="login-page__subtitle">Entre para administrar sua quadra</p>

          {formError && <div className="login-page__error">{formError}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="login-page__field">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
              />
              {fieldErrors.email && (
                <span className="login-page__field-error">{fieldErrors.email}</span>
              )}
            </div>

            <div className="login-page__field">
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              {fieldErrors.password && (
                <span className="login-page__field-error">{fieldErrors.password}</span>
              )}
            </div>

            <button type="submit" className="login-page__submit" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="login-page__footer">
            Ainda não tem conta? <a href="/cadastro">Criar conta</a>
          </div>
        </div>
      </div>

      <div className="login-page__panel login-page__panel--illustration">
        <h2 className="login-page__headline">Gestão completa para sua quadra</h2>
        <p className="login-page__headline-subtitle">
          Agenda online, controle de reservas, pagamentos e muito mais. Tudo em um só lugar.
        </p>
        <DeviceMockup className="login-page__mockup" />
      </div>
    </div>
  )
}
