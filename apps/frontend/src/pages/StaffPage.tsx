import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { usePainelContext } from '../components/panel/PainelLayout'
import { SessionExpiredError } from '../lib/api'
import { createStaff, fetchStaff, removeStaff, updateStaff } from '../lib/staff'
import type { StaffMember, StaffPermission } from '../lib/staff'
import './StaffPage.css'

function permissionLabel(permission: StaffPermission): string {
  return permission === 'MANAGE_RESERVATIONS' ? 'Gerencia reservas' : 'Somente visualiza'
}

export default function StaffPage() {
  const { onSessionExpired } = usePainelContext()
  const [staff, setStaff] = useState<StaffMember[] | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [permission, setPermission] = useState<StaffPermission>('MANAGE_RESERVATIONS')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  function load() {
    fetchStaff()
      .then(setStaff)
      .catch((err) => {
        if (err instanceof SessionExpiredError) {
          onSessionExpired()
          return
        }
        setError(err instanceof Error ? err.message : 'Erro ao carregar os funcionários')
      })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleAdd(event: FormEvent) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    try {
      await createStaff({ name, email, password, permission })
      setName('')
      setEmail('')
      setPassword('')
      setPermission('MANAGE_RESERVATIONS')
      load()
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
        return
      }
      setError(err instanceof Error ? err.message : 'Não foi possível cadastrar o funcionário')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleActive(member: StaffMember) {
    try {
      const updated = await updateStaff(member.id, { active: !member.active })
      setStaff((prev) => (prev ? prev.map((s) => (s.id === updated.id ? updated : s)) : prev))
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
      }
    }
  }

  async function handleRemove(id: string) {
    try {
      await removeStaff(id)
      setStaff((prev) => (prev ? prev.filter((s) => s.id !== id) : prev))
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
      }
    }
  }

  const active = (staff ?? []).filter((s) => s.active)

  return (
    <div className="staff-page">
      <h1>Funcionários</h1>
      <p className="staff-page__subtitle">
        Cadastre e-mail e senha pro funcionário entrar no painel (aba "Sou funcionário" na tela de login). Ele só vê Visão geral e Quadras, com a agenda liberada conforme a permissão.
      </p>

      {error && <p className="staff-page__error">{error}</p>}

      {!error && staff === null && <p className="staff-page__loading">Carregando...</p>}

      {staff !== null && (
        <div className="staff-page__layout">
          <form className="staff-page__form card" onSubmit={handleAdd}>
            <h2>Novo funcionário</h2>
            <label className="staff-page__field">
              <span>Nome</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nome do funcionário"
                required
                minLength={2}
              />
            </label>
            <label className="staff-page__field">
              <span>E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="funcionario@email.com"
                required
              />
            </label>
            <label className="staff-page__field">
              <span>Senha</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </label>
            <label className="staff-page__field">
              <span>Permissão</span>
              <select value={permission} onChange={(event) => setPermission(event.target.value as StaffPermission)}>
                <option value="MANAGE_RESERVATIONS">Gerencia reservas (agenda, lançar, cancelar)</option>
                <option value="VIEW_ONLY">Somente visualiza (não pode alterar nada)</option>
              </select>
            </label>
            <button type="submit" className="btn btn--primary btn--full" disabled={isSaving}>
              {isSaving ? 'Adicionando...' : '+ Adicionar funcionário'}
            </button>
          </form>

          {active.length === 0 ? (
            <div className="staff-page__empty card">
              <p>Nenhum funcionário cadastrado ainda.</p>
              <span>Depois de cadastrar, ele pode entrar pelo login com "Sou funcionário", usando o e-mail e a senha definidos aqui.</span>
            </div>
          ) : (
            <div className="staff-page__list">
              {active.map((member) => (
                <div key={member.id} className="staff-page__item">
                  <span className="staff-page__avatar" aria-hidden="true">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="staff-page__info">
                    <strong>{member.name}</strong>
                    <small>{member.email}</small>
                    <span className="pill pill--info">{permissionLabel(member.permission)}</span>
                  </span>
                  <div className="staff-page__item-actions">
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => handleToggleActive(member)}>
                      Desativar
                    </button>
                    <button
                      type="button"
                      className="staff-page__remove"
                      onClick={() => handleRemove(member.id)}
                      aria-label="Remover funcionário"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
