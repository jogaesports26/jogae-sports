import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from './AuthLayout'
import PasswordInput from '../components/PasswordInput'
import { API_URL, parseApiError } from '../lib/api'

interface FormErrors {
  password?: string
  confirmPassword?: string
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  function validate(): FormErrors {
    const errors: FormErrors = {}
    if (password.length < 6) errors.password = 'A senha deve ter pelo menos 6 caracteres'
    if (confirmPassword !== password) errors.confirmPassword = 'As senhas não coincidem'
    return errors
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      })

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Link inválido ou expirado'))
      }

      setDone(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Não foi possível redefinir a senha')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!token) {
    return (
      <AuthLayout headline="Link inválido" subtitle="Esse link de redefinição não é válido.">
        <div className="auth__brand">Jogaê Sports - Gestão</div>
        <h1>Link inválido</h1>
        <p className="auth__subtitle">
          Peça um novo link em <Link to="/esqueci-senha">Esqueci minha senha</Link>.
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout headline="Quase lá" subtitle="Escolha uma nova senha pra voltar a gerenciar sua quadra.">
      <div className="auth__brand">Jogaê Sports - Gestão</div>

      <h1>Redefinir senha</h1>
      <p className="auth__subtitle">Escolha uma nova senha pra sua conta.</p>

      {formError && <div className="auth__error">{formError}</div>}

      {done ? (
        <p>Senha redefinida! Te levando pro login...</p>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div className="auth__field">
            <label htmlFor="password">Nova senha</label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
            {fieldErrors.password && <span className="auth__field-error">{fieldErrors.password}</span>}
          </div>

          <div className="auth__field">
            <label htmlFor="confirmPassword">Repita a nova senha</label>
            <PasswordInput
              id="confirmPassword"
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
            {isSubmitting ? 'Salvando...' : 'Redefinir senha'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
