import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { usePainelContext } from '../components/panel/PainelLayout'
import { SessionExpiredError } from '../lib/api'
import { createInstructor, fetchInstructors, removeInstructor } from '../lib/instructors'
import type { Instructor } from '../lib/instructors'
import './InstructorsPage.css'

export default function InstructorsPage() {
  const { onSessionExpired } = usePainelContext()
  const [instructors, setInstructors] = useState<Instructor[] | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  function load() {
    fetchInstructors()
      .then(setInstructors)
      .catch((err) => {
        if (err instanceof SessionExpiredError) {
          onSessionExpired()
          return
        }
        setError(err instanceof Error ? err.message : 'Erro ao carregar os instrutores')
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
      await createInstructor({ name, phone: phone || undefined })
      setName('')
      setPhone('')
      load()
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
        return
      }
      setError(err instanceof Error ? err.message : 'Não foi possível cadastrar o instrutor')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleRemove(id: string) {
    try {
      await removeInstructor(id)
      setInstructors((prev) => (prev ? prev.filter((i) => i.id !== id) : prev))
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
      }
    }
  }

  const active = (instructors ?? []).filter((i) => i.active)

  return (
    <div className="instructors-page">
      <h1>Equipe</h1>
      <p className="instructors-page__subtitle">
        Professores e instrutores da sua arena — associe um a uma reserva na hora de lançar.
      </p>

      {error && <p className="instructors-page__error">{error}</p>}

      {!error && instructors === null && <p className="instructors-page__loading">Carregando...</p>}

      {instructors !== null && (
        <div className="instructors-page__layout">
          <form className="instructors-page__form card" onSubmit={handleAdd}>
            <h2>Adicionar instrutor</h2>
            <label className="instructors-page__field">
              <span>Nome</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nome do instrutor"
                required
                minLength={2}
              />
            </label>
            <label className="instructors-page__field">
              <span>Telefone (opcional)</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="(85) 99999-9999"
              />
            </label>
            <button type="submit" className="btn btn--primary btn--full" disabled={isSaving}>
              {isSaving ? 'Adicionando...' : '+ Adicionar instrutor'}
            </button>
          </form>

          {active.length === 0 ? (
            <div className="instructors-page__empty card">
              <p>Nenhum instrutor cadastrado ainda.</p>
              <span>Depois de cadastrar, ele aparece como opção ao lançar uma reserva na Agenda.</span>
            </div>
          ) : (
            <div className="instructors-page__list">
              {active.map((instructor) => (
                <div key={instructor.id} className="instructors-page__item">
                  <span className="instructors-page__avatar" aria-hidden="true">
                    {instructor.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="instructors-page__name">
                    <strong>{instructor.name}</strong>
                    <small>{instructor.phone || 'Sem telefone'}</small>
                  </span>
                  <button
                    type="button"
                    className="instructors-page__remove"
                    onClick={() => handleRemove(instructor.id)}
                    aria-label="Remover instrutor"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
