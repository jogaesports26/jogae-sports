import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthLayout from './AuthLayout'
import PasswordInput from '../components/PasswordInput'
import { API_URL, parseApiError, saveSession, staffLogin, type AuthResponse } from '../lib/api'

type LoginAs = 'owner' | 'staff'

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
  const navigate = useNavigate()
  const [loginAs, setLoginAs] = useState<LoginAs>('owner')
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
      let data: AuthResponse
      if (loginAs === 'staff') {
        data = await staffLogin(email, password)
      } else {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })

        if (!response.ok) {
          throw new Error(await parseApiError(response, 'E-mail ou senha inválidos'))
        }

        data = await response.json()
      }

      saveSession(data)
      navigate('/painel')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Não foi possível fazer login')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      headline="Gestão completa para sua quadra"
      subtitle="Agenda online, controle de reservas, pagamentos e muito mais. Tudo em um só lugar."
    >
      <div className="auth__brand">Jogaê Sports - Gestão</div>

      <h1>Bem-vindo de volta</h1>
      <p className="auth__subtitle">
        {loginAs === 'staff' ? 'Entre com os dados que o dono cadastrou pra você' : 'Entre para administrar sua quadra'}
      </p>

      <div className="auth__role-toggle" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={loginAs === 'owner'}
          className={loginAs === 'owner' ? 'auth__role-toggle-btn auth__role-toggle-btn--active' : 'auth__role-toggle-btn'}
          onClick={() => setLoginAs('owner')}
        >
          Sou dono
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={loginAs === 'staff'}
          className={loginAs === 'staff' ? 'auth__role-toggle-btn auth__role-toggle-btn--active' : 'auth__role-toggle-btn'}
          onClick={() => setLoginAs('staff')}
        >
          Sou funcionário
        </button>
      </div>

      {formError && <div className="auth__error">{formError}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="auth__field">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
          />
          {fieldErrors.email && <span className="auth__field-error">{fieldErrors.email}</span>}
        </div>

        <div className="auth__field">
          <label htmlFor="password">Senha</label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          {fieldErrors.password && (
            <span className="auth__field-error">{fieldErrors.password}</span>
          )}
        </div>

        <button type="submit" className="auth__submit" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      {loginAs === 'owner' && (
        <>
          <div className="auth__footer">
            <Link to="/esqueci-senha">Esqueci minha senha</Link>
          </div>
          <div className="auth__footer">
            Ainda não tem conta? <Link to="/cadastro">Criar conta</Link>
          </div>
        </>
      )}
      {loginAs === 'staff' && (
        <div className="auth__footer">Esqueceu a senha? Peça pro dono da quadra redefinir.</div>
      )}
    </AuthLayout>
  )
}
