import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { usePainelContext } from '../components/panel/PainelLayout'
import { SessionExpiredError } from '../lib/api'
import { createEquipment, fetchEquipment, removeEquipment, updateEquipment } from '../lib/equipment'
import type { Equipment } from '../lib/equipment'
import './EquipmentPage.css'

export default function EquipmentPage() {
  const { onSessionExpired } = usePainelContext()
  const [equipment, setEquipment] = useState<Equipment[] | null>(null)
  const [name, setName] = useState('')
  const [pricePerUnit, setPricePerUnit] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  function load() {
    fetchEquipment()
      .then(setEquipment)
      .catch((err) => {
        if (err instanceof SessionExpiredError) {
          onSessionExpired()
          return
        }
        setError(err instanceof Error ? err.message : 'Erro ao carregar os equipamentos')
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
      await createEquipment({ name, pricePerUnit: Number(pricePerUnit) })
      setName('')
      setPricePerUnit('')
      load()
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
        return
      }
      setError(err instanceof Error ? err.message : 'Não foi possível cadastrar o equipamento')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleActive(item: Equipment) {
    try {
      const updated = await updateEquipment(item.id, { active: !item.active })
      setEquipment((prev) => (prev ? prev.map((e) => (e.id === updated.id ? updated : e)) : prev))
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
      }
    }
  }

  function startEdit(item: Equipment) {
    setEditingId(item.id)
    setEditName(item.name)
    setEditPrice(String(item.pricePerUnit))
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function handleSaveEdit(id: string) {
    setIsSavingEdit(true)
    setError('')
    try {
      const updated = await updateEquipment(id, { name: editName, pricePerUnit: Number(editPrice) })
      setEquipment((prev) => (prev ? prev.map((e) => (e.id === updated.id ? updated : e)) : prev))
      setEditingId(null)
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
        return
      }
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o equipamento')
    } finally {
      setIsSavingEdit(false)
    }
  }

  async function handleRemove(id: string) {
    try {
      await removeEquipment(id)
      setEquipment((prev) => (prev ? prev.filter((e) => e.id !== id) : prev))
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
      }
    }
  }

  const active = (equipment ?? []).filter((e) => e.active)

  return (
    <div className="equipment-page">
      <h1>Equipamentos</h1>
      <p className="equipment-page__subtitle">
        Itens avulsos pra alugar junto da reserva — bola, colete, luva de goleiro. O valor entra somado no total na hora de lançar ou reservar.
      </p>

      {error && <p className="equipment-page__error">{error}</p>}

      {!error && equipment === null && <p className="equipment-page__loading">Carregando...</p>}

      {equipment !== null && (
        <div className="equipment-page__layout">
          <form className="equipment-page__form card" onSubmit={handleAdd}>
            <h2>Novo equipamento</h2>
            <label className="equipment-page__field">
              <span>Nome</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Colete"
                required
                minLength={2}
                maxLength={60}
              />
            </label>
            <label className="equipment-page__field">
              <span>Preço por unidade (R$)</span>
              <input
                type="number"
                min={0.01}
                step="0.01"
                value={pricePerUnit}
                onChange={(event) => setPricePerUnit(event.target.value)}
                placeholder="10.00"
                required
              />
            </label>
            <button type="submit" className="btn btn--primary btn--full" disabled={isSaving}>
              {isSaving ? 'Adicionando...' : '+ Adicionar equipamento'}
            </button>
          </form>

          {active.length === 0 ? (
            <div className="equipment-page__empty card">
              <p>Nenhum equipamento cadastrado ainda.</p>
              <span>Depois de cadastrar, ele aparece como opção ao lançar uma reserva ou pro jogador reservar pelo portal.</span>
            </div>
          ) : (
            <div className="equipment-page__list">
              {active.map((item) => (
                <div key={item.id} className="equipment-page__item">
                  {editingId === item.id ? (
                    <div className="equipment-page__edit">
                      <label className="equipment-page__field">
                        <span>Nome</span>
                        <input
                          value={editName}
                          onChange={(event) => setEditName(event.target.value)}
                          minLength={2}
                          maxLength={60}
                        />
                      </label>
                      <label className="equipment-page__field">
                        <span>Preço por unidade (R$)</span>
                        <input
                          type="number"
                          min={0.01}
                          step="0.01"
                          value={editPrice}
                          onChange={(event) => setEditPrice(event.target.value)}
                        />
                      </label>
                      <div className="equipment-page__item-actions">
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={cancelEdit}
                          disabled={isSavingEdit}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          onClick={() => handleSaveEdit(item.id)}
                          disabled={isSavingEdit || !editName.trim() || !editPrice}
                        >
                          {isSavingEdit ? 'Salvando...' : 'Salvar'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="equipment-page__name">{item.name}</span>
                      <span className="equipment-page__price">
                        R$ {item.pricePerUnit.toFixed(2).replace('.', ',')} <small>/ unidade</small>
                      </span>
                      <div className="equipment-page__item-actions">
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => startEdit(item)}>
                          Editar
                        </button>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => handleToggleActive(item)}>
                          Desativar
                        </button>
                        <button
                          type="button"
                          className="equipment-page__remove"
                          onClick={() => handleRemove(item.id)}
                          aria-label="Remover equipamento"
                        >
                          ×
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
