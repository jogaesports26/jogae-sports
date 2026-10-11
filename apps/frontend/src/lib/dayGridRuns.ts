/** Estado de uma hora da grade (o mesmo formato de `AgendaCellState`, sem depender dele). */
export type LaneState<R extends { id: string }> =
  | { kind: 'reserved'; reservation: R }
  | { kind: 'blocked' }
  | { kind: 'available' }
  | { kind: 'noPrice' }

/** Um bloco da "grade do dia" de uma quadra: ocupa `span` colunas (horas) a partir de `start`. */
export type LaneItem<R extends { id: string }> =
  | { kind: 'reserved'; start: number; span: number; reservation: R }
  | { kind: 'blocked'; start: number; span: number }
  | { kind: 'available'; start: number; span: 1 }
  | { kind: 'noPrice'; start: number; span: 1 }

/**
 * Junta horas seguidas da mesma reserva (ou de manutenção) num bloco só, para a grade mostrar
 * "Larissa 20h–22h" como uma peça em vez de duas células.
 */
export function buildLaneItems<R extends { id: string }>(states: LaneState<R>[]): LaneItem<R>[] {
  const items: LaneItem<R>[] = []
  let i = 0

  while (i < states.length) {
    const state = states[i]

    if (state.kind === 'reserved') {
      let end = i + 1
      while (end < states.length) {
        const next = states[end]
        if (next.kind !== 'reserved' || next.reservation.id !== state.reservation.id) break
        end += 1
      }
      items.push({ kind: 'reserved', start: i, span: end - i, reservation: state.reservation })
      i = end
    } else if (state.kind === 'blocked') {
      let end = i + 1
      while (end < states.length && states[end].kind === 'blocked') end += 1
      items.push({ kind: 'blocked', start: i, span: end - i })
      i = end
    } else {
      items.push({ kind: state.kind, start: i, span: 1 })
      i += 1
    }
  }

  return items
}
