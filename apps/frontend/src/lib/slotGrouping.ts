export interface GroupedSlots<T> {
  /** Os horários que aparecem na lista. */
  listed: T[]
  /** Quantos horários intermediários (":30" etc.) ficaram de fora. */
  hiddenCount: number
  /** Há horários intermediários que podem ser mostrados ou escondidos. */
  canToggle: boolean
}

/**
 * Quando a arena oferece horários de 30 em 30 minutos, a lista fica cheia de botões quase iguais
 * (06:00–07:00, 06:30–07:30…). Por padrão mostra só os que começam na hora cheia; o resto aparece com
 * "ver todos". O horário já escolhido nunca some, e se esconder deixasse a lista vazia, mostra tudo.
 */
export function groupFullHours<T extends { startMinute: number }>(
  slots: T[],
  stepMinutes: number,
  showAll: boolean,
  keep: (slot: T) => boolean = () => false,
): GroupedSlots<T> {
  const intermediate = (slot: T) => slot.startMinute % 60 !== 0
  const canToggle = stepMinutes < 60 && slots.some(intermediate)
  if (!canToggle || showAll) return { listed: slots, hiddenCount: 0, canToggle }

  const listed = slots.filter((slot) => !intermediate(slot) || keep(slot))
  if (listed.length === 0) return { listed: slots, hiddenCount: 0, canToggle: false }
  return { listed, hiddenCount: slots.length - listed.length, canToggle }
}
