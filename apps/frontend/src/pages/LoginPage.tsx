import { useState, type FormEvent, type CSSProperties } from 'react'
import './LoginPage.css'
import {
  SoccerBall,
  Basketball,
  Volleyball,
  TennisBall,
  TennisRacket,
  BadmintonRacket,
  Whistle,
  Trophy,
  Stopwatch,
  BoxingGlove,
} from './SportIcons'

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

interface SportIconPlacement {
  Icon: typeof SoccerBall
  top: string
  left: string
  size: number
  rotate: number
  opacity: number
  behindCard?: boolean
}

const SPORT_ICON_LAYOUT: SportIconPlacement[] = [
  { Icon: TennisRacket, top: '4%', left: '10%', size: 70, rotate: -22, opacity: 0.9 },
  { Icon: SoccerBall, top: '-6%', left: '38%', size: 90, rotate: 8, opacity: 0.55, behindCard: true },
  { Icon: Whistle, top: '2%', left: '68%', size: 64, rotate: -8, opacity: 0.85 },
  { Icon: Basketball, top: '20%', left: '88%', size: 76, rotate: 12, opacity: 0.9 },
  { Icon: TennisBall, top: '10%', left: '-4%', size: 46, rotate: -10, opacity: 0.8 },
  { Icon: Volleyball, top: '32%', left: '4%', size: 58, rotate: 15, opacity: 0.5, behindCard: true },
  { Icon: Trophy, top: '38%', left: '86%', size: 60, rotate: -6, opacity: 0.9 },
  { Icon: BadmintonRacket, top: '58%', left: '-3%', size: 68, rotate: 24, opacity: 0.85 },
  { Icon: Stopwatch, top: '68%', left: '82%', size: 58, rotate: 10, opacity: 0.85 },
  { Icon: BoxingGlove, top: '80%', left: '6%', size: 64, rotate: -14, opacity: 0.9 },
  { Icon: TennisBall, top: '86%', left: '58%', size: 40, rotate: 6, opacity: 0.6, behindCard: true },
  { Icon: SoccerBall, top: '78%', left: '92%', size: 68, rotate: -10, opacity: 0.85 },
  { Icon: Basketball, top: '92%', left: '30%', size: 50, rotate: 18, opacity: 0.75 },
  { Icon: Volleyball, top: '-4%', left: '90%', size: 54, rotate: -18, opacity: 0.7 },
]

const MOBILE_SPORT_ICON_LAYOUT: Omit<SportIconPlacement, 'behindCard'>[] = [
  { Icon: TennisBall, top: '6%', left: '80%', size: 22, rotate: -10, opacity: 0.9 },
  { Icon: SoccerBall, top: '4%', left: '4%', size: 26, rotate: 8, opacity: 0.9 },
  { Icon: TennisRacket, top: '48%', left: '90%', size: 32, rotate: 24, opacity: 0.9 },
  { Icon: Trophy, top: '55%', left: '2%', size: 26, rotate: -10, opacity: 0.85 },
]

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
          <div className="login-page__brand">Jogaê Sports</div>

          <h1>Bem-vindo de volta</h1>
          <p className="login-page__subtitle">Entre para reservar sua quadra</p>

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
        <div className="login-page__sport-icons login-page__sport-icons--desktop">
          {SPORT_ICON_LAYOUT.map(({ Icon, top, left, size, rotate, opacity, behindCard }, index) => {
            const style: CSSProperties = {
              top,
              left,
              width: size,
              opacity,
              transform: `rotate(${rotate}deg)`,
              zIndex: behindCard ? 0 : 2,
            }
            return <Icon key={index} className="login-page__sport-icon" style={style} />
          })}
        </div>

        <div className="login-page__sport-icons login-page__sport-icons--mobile">
          {MOBILE_SPORT_ICON_LAYOUT.map(({ Icon, top, left, size, rotate, opacity }, index) => {
            const style: CSSProperties = {
              top,
              left,
              width: size,
              opacity,
              transform: `rotate(${rotate}deg)`,
            }
            return <Icon key={index} className="login-page__sport-icon" style={style} />
          })}
        </div>

        <div className="login-page__illustration-card">
          <svg
            className="login-page__icon"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="32" cy="24" r="16" fill="#FFFFFF" fillOpacity="0.15" />
            <path
              d="M32 8C22.6 8 15 15.6 15 25c0 12 17 31 17 31s17-19 17-31c0-9.4-7.6-17-17-17Z"
              fill="#FFFFFF"
              fillOpacity="0.9"
            />
            <circle cx="32" cy="25" r="7" fill="#1A237E" />
          </svg>
          <h2>Sua quadra, a um clique</h2>
          <p>
            Encontre e reserve quadras esportivas perto de você. Times, horários e pagamentos,
            tudo em um só lugar.
          </p>
        </div>
      </div>
    </div>
  )
}
