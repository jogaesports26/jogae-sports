/** Instante em que um horário do dia `dayDate` começa (mesma construção usada ao enviar a reserva ao servidor). */
export function slotStartsAt(dayDate: Date, startMinute: number): Date {
  const date = new Date(dayDate)
  date.setHours(0, startMinute, 0, 0)
  return date
}

/**
 * O horário já começou (ou está começando agora)? O servidor recusa reserva com início antes de "agora",
 * então a tela não deve oferecer esses horários. Só vale para horários livres: reservas antigas continuam consultáveis.
 */
export function isSlotInPast(dayDate: Date, startMinute: number, now: Date = new Date()): boolean {
  return slotStartsAt(dayDate, startMinute).getTime() <= now.getTime()
}

/** Só os inícios (em minutos desde 00:00) que ainda não começaram. */
export function startsNotInPast(starts: number[], dayDate: Date, now: Date): number[] {
  return starts.filter((start) => !isSlotInPast(dayDate, start, now))
}
