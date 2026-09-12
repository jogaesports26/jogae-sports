import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useCourtDetailContext } from '../components/panel/CourtDetailLayout'
import { SessionExpiredError } from '../lib/api'
import { fetchMaintenanceHistory, updateMaintenanceBlock } from '../lib/reservations'
import type { MaintenanceBlock } from '../lib/reservations'
import MaintenanceBlockModal from '../components/panel/MaintenanceBlockModal'
import './CourtMaintenancePage.css'

function formatRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  const date = start.toLocaleDateString('pt-BR')
  const startTime = start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const endTime = end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${date} · ${startTime}–${endTime}`
}

export default function CourtMaintenancePage() {
  const { courtId } = useParams<{ courtId: string }>()
  const { onSessionExpired } = useCourtDetailContext()
  const [blocks, setBlocks] = useState<MaintenanceBlock[] | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')

  function load() {
    if (!courtId) return
    fetchMaintenanceHistory(courtId)
      .then(setBlocks)
      .catch((err) => {
        if (err instanceof SessionExpiredError) {
          onSessionExpired()
          return
        }
        setError(err instanceof Error ? err.message : 'Erro ao carregar o histórico de manutenção')
      })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courtId])

  async function handleMarkCompleted(block: MaintenanceBlock) {
    if (!courtId) return
    setSavingId(block.id)
    setError('')
    const costInput = drafts[block.id] ?? block.cost ?? ''
    try {
      const updated = await updateMaintenanceBlock(courtId, block.id, {
        cost: costInput ? Number(costInput) : undefined,
        completedAt: new Date().toISOString(),
      })
      setBlocks((prev) => (prev ? prev.map((b) => (b.id === block.id ? updated : b)) : prev))
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
        return
      }
      setError(err instanceof Error ? err.message : 'Não foi possível salvar')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="court-maintenance-page">
      <div className="court-maintenance-page__header">
        <div>
          <h2>Manutenção</h2>
          <p className="court-maintenance-page__hint">
            Bloqueios pontuais dessa quadra, com custo registrado quando o serviço é concluído.
          </p>
        </div>
        <button type="button" className="btn btn--primary btn--sm" onClick={() => setIsCreating(true)}>
          + Novo bloqueio
        </button>
      </div>

      {error && <p className="court-maintenance-page__error">{error}</p>}

      {!error && blocks === null && <p className="court-maintenance-page__loading">Carregando...</p>}

      {blocks !== null && blocks.length === 0 && (
        <div className="court-maintenance-page__empty card">
          <p>Nenhum bloqueio de manutenção registrado ainda.</p>
        </div>
      )}

      {blocks !== null && blocks.length > 0 && (
        <div className="court-maintenance-page__list">
          {blocks.map((block) => (
            <div key={block.id} className="court-maintenance-page__item">
              <div className="court-maintenance-page__info">
                <strong>{formatRange(block.startsAt, block.endsAt)}</strong>
                <small>{block.reason || 'Sem motivo informado'}</small>
              </div>

              {block.completedAt ? (
                <span className="pill pill--positive">
                  Concluído · R$ {Number(block.cost ?? 0).toFixed(2).replace('.', ',')}
                </span>
              ) : (
                <div className="court-maintenance-page__actions">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Custo (R$)"
                    value={drafts[block.id] ?? block.cost ?? ''}
                    onChange={(event) => setDrafts((prev) => ({ ...prev, [block.id]: event.target.value }))}
                  />
                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    disabled={savingId === block.id}
                    onClick={() => handleMarkCompleted(block)}
                  >
                    {savingId === block.id ? 'Salvando...' : 'Marcar concluído'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isCreating && courtId && (
        <MaintenanceBlockModal
          courtId={courtId}
          onClose={() => setIsCreating(false)}
          onCreated={() => {
            setIsCreating(false)
            load()
          }}
          onSessionExpired={onSessionExpired}
        />
      )}
    </div>
  )
}
