import type { Court } from '../../lib/courts'
import './CourtScopePicker.css'

interface CourtScopePickerProps {
  courts: Court[]
  /** Todas as quadras (padrão) ou só as escolhidas. */
  all: boolean
  selectedIds: string[]
  onChange: (next: { all: boolean; selectedIds: string[] }) => void
  legend?: string
}

/** "Onde aparece": todas as quadras ou só algumas. Quem tem uma quadra só não vê isto (não há o que escolher). */
export default function CourtScopePicker({ courts, all, selectedIds, onChange, legend = 'Onde aparece' }: CourtScopePickerProps) {
  if (courts.length < 2) return null

  function toggle(id: string) {
    const next = selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]
    onChange({ all: false, selectedIds: next })
  }

  return (
    <fieldset className="court-scope">
      <legend>{legend}</legend>
      <label className="court-scope__option">
        <input
          type="checkbox"
          checked={all}
          onChange={(event) => onChange({ all: event.target.checked, selectedIds: event.target.checked ? [] : selectedIds })}
        />
        Todas as quadras
      </label>
      {!all && (
        <>
          <div className="court-scope__list">
            {courts.map((court) => (
              <label key={court.id} className="court-scope__option">
                <input type="checkbox" checked={selectedIds.includes(court.id)} onChange={() => toggle(court.id)} />
                {court.name}
              </label>
            ))}
          </div>
          {selectedIds.length === 0 && <small className="court-scope__hint">Escolha ao menos uma quadra.</small>}
        </>
      )}
    </fieldset>
  )
}
