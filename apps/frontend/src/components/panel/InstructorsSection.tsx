import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { SessionExpiredError } from '../../lib/api'
import { createInstructor, fetchInstructors, removeInstructor } from '../../lib/instructors'
import type { Instructor } from '../../lib/instructors'
import './InstructorsSection.css'

interface InstructorsSectionProps {
  onSessionExpired: () => void
}

export default function InstructorsSection({ onSessionExpired }: InstructorsSectionProps) {
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
    <div className="instructors-section card">
      <h2>Instrutores</h2>
      <p className="instructors-section__hint">
        Cadastre os professores/instrutores da sua arena pra associar a uma reserva na hora de lançar.
      </p>

      {error && <p className="instructors-section__error">{error}</p>}

      {active.length > 0 && (
        <div className="instructors-section__list">
          {active.map((instructor) => (
            <div key={instructor.id} className="instructors-section__item">
              <span className="instructors-section__name">
                <strong>{instructor.name}</strong>
                {instructor.phone && <small>{instructor.phone}</small>}
              </span>
              <button
                type="button"
                className="instructors-section__remove"
                onClick={() => handleRemove(instructor.id)}
                aria-label="Remover instrutor"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <form className="instructors-section__form" onSubmit={handleAdd}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nome do instrutor"
          required
          minLength={2}
        />
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Telefone (opcional)"
        />
        <button type="submit" className="btn btn--outline btn--sm" disabled={isSaving}>
          {isSaving ? 'Adicionando...' : '+ Adicionar'}
        </button>
      </form>
    </div>
  )
}
