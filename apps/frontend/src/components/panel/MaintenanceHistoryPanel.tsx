import { useEffect, useState } from 'react'
import { SessionExpiredError } from '../../lib/api'
import { fetchMaintenanceHistory, updateMaintenanceBlock } from '../../lib/reservations'
import type { MaintenanceBlock } from '../../lib/reservations'
import './MaintenanceHistoryPanel.css'

interface MaintenanceHistoryPanelProps {
  courtId: string
  onSessionExpired: () => void
}

function formatRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  const date = start.toLocaleDateString('pt-BR')
  const startTime = start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const endTime = end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${date} · ${startTime}–${endTime}`
}

export default function MaintenanceHistoryPanel({ courtId, onSessionExpired }: MaintenanceHistoryPanelProps) {
  const [blocks, setBlocks] = useState<MaintenanceBlock[] | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMaintenanceHistory(courtId)
      .then(setBlocks)
      .catch((err) => {
        if (err instanceof SessionExpiredError) {
          onSessionExpired()
          return
        }
        setError(err instanceof Error ? err.message : 'Erro ao carregar o histórico de manutenção')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courtId])

  async function handleMarkCompleted(block: MaintenanceBlock) {
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

  if (!blocks || blocks.length === 0) return null

  return (
    <div className="maintenance-history card">
      <h2>Histórico de manutenção</h2>
      <p className="maintenance-history__hint">Bloqueios pontuais dessa quadra, com custo registrado quando o serviço é concluído.</p>

      {error && <p className="maintenance-history__error">{error}</p>}

      <div className="maintenance-history__list">
        {blocks.map((block) => (
          <div key={block.id} className="maintenance-history__item">
            <div className="maintenance-history__info">
              <strong>{formatRange(block.startsAt, block.endsAt)}</strong>
              <small>{block.reason || 'Sem motivo informado'}</small>
            </div>

            {block.completedAt ? (
              <span className="pill pill--positive">
                Concluído · R$ {Number(block.cost ?? 0).toFixed(2).replace('.', ',')}
              </span>
            ) : (
              <div className="maintenance-history__actions">
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
    </div>
  )
}
