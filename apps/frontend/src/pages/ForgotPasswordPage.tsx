import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from './AuthLayout'
import { API_URL, parseApiError } from '../lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [devLink, setDevLink] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Não foi possível processar o pedido'))
      }

      const data = await response.json()
      setSent(true)
      if (data.devResetToken) {
        setDevLink(`${window.location.origin}/redefinir-senha?token=${data.devResetToken}`)
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Não foi possível processar o pedido')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      headline="Esqueceu sua senha?"
      subtitle="Sem problema. A gente te ajuda a voltar pro seu painel em poucos passos."
    >
      <div className="auth__brand">Jogaê Sports - Gestão</div>

      <h1>Esqueci minha senha</h1>
      <p className="auth__subtitle">Digite seu e-mail e enviaremos um link pra redefinir sua senha.</p>

      {formError && <div className="auth__error">{formError}</div>}

      {sent ? (
        <div className="auth__field">
          <p>Se esse e-mail existir na nossa base, você vai receber um link de redefinição.</p>
          {devLink && (
            <p style={{ fontSize: 13, opacity: 0.75, wordBreak: 'break-all' }}>
              (ambiente de teste, sem provedor de e-mail configurado ainda —{' '}
              <Link to={devLink.replace(window.location.origin, '')}>clique aqui pra continuar</Link>)
            </p>
          )}
        </div>
      ) : (
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
              required
            />
          </div>

          <button type="submit" className="auth__submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Enviar link de redefinição'}
          </button>
        </form>
      )}

      <div className="auth__footer">
        <Link to="/login">Voltar pro login</Link>
      </div>
    </AuthLayout>
  )
}
