import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthLayout from './AuthLayout'
import { API_URL, parseApiError, saveSession, type AuthResponse } from '../lib/api'

interface FormErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
}

function validate(
  name: string,
  email: string,
  password: string,
  confirmPassword: string,
): FormErrors {
  const errors: FormErrors = {}

  if (!name.trim()) {
    errors.name = 'Informe seu nome'
  } else if (name.trim().length < 2) {
    errors.name = 'Nome muito curto'
  }

  if (!email.trim()) {
    errors.email = 'Informe seu e-mail'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'E-mail inválido'
  }

  if (!password) {
    errors.password = 'Informe uma senha'
  } else if (password.length < 6) {
    errors.password = 'A senha deve ter pelo menos 6 caracteres'
  }

  if (confirmPassword !== password) {
    errors.confirmPassword = 'As senhas não coincidem'
  }

  return errors
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const errors = validate(name, email, password, confirmPassword)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Não foi possível criar sua conta'))
      }

      const data: AuthResponse = await response.json()
      saveSession(data)
      navigate('/painel')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Não foi possível criar sua conta')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      headline="Comece a gerenciar sua quadra hoje"
      subtitle="Crie sua conta e organize agenda, reservas e pagamentos em um só lugar."
    >
      <div className="auth__brand">Jogaê Sports - Gestão</div>

      <h1>Criar conta</h1>
      <p className="auth__subtitle">Cadastro do responsável pelo estabelecimento</p>

      {formError && <div className="auth__error">{formError}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="auth__field">
          <label htmlFor="name">Nome completo</label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
          />
          {fieldErrors.name && <span className="auth__field-error">{fieldErrors.name}</span>}
        </div>

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
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
          {fieldErrors.password && (
            <span className="auth__field-error">{fieldErrors.password}</span>
          )}
        </div>

        <div className="auth__field">
          <label htmlFor="confirmPassword">Confirmar senha</label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita a senha"
          />
          {fieldErrors.confirmPassword && (
            <span className="auth__field-error">{fieldErrors.confirmPassword}</span>
          )}
        </div>

        <button type="submit" className="auth__submit" disabled={isSubmitting}>
          {isSubmitting ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>

      <div className="auth__footer">
        Já tem conta? <Link to="/">Entrar</Link>
      </div>
    </AuthLayout>
  )
}
