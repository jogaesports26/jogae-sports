export interface HoursRule {
  dayOfWeek: number
  startMinute: number
  endMinute: number
}

export interface OpeningHoursLine {
  /** "Seg a Sex", "Sáb e Dom", "Dom"… */
  days: string
  /** "6h às 23h" ou "Fechado". */
  hours: string
}

const SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
/** Semana começando na segunda: 1,2,3,4,5,6,0. */
const ORDER = [1, 2, 3, 4, 5, 6, 0]

function hour(minute: number) {
  const h = Math.floor(minute / 60)
  const m = minute % 60
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}

/**
 * Horário de funcionamento deduzido dos horários com preço: em cada dia, da primeira abertura ao último fechamento
 * entre as quadras. Dias seguidos com o mesmo horário viram uma linha ("Seg a Sex 6h às 23h").
 */
export function describeOpeningHours(rules: HoursRule[]): OpeningHoursLine[] {
  const perDay = ORDER.map((day) => {
    const own = rules.filter((r) => r.dayOfWeek === day)
    if (own.length === 0) return { day, key: 'closed', hours: 'Fechado' }
    const open = Math.min(...own.map((r) => r.startMinute))
    const close = Math.max(...own.map((r) => r.endMinute))
    return { day, key: `${open}-${close}`, hours: `${hour(open)} às ${hour(close)}` }
  })
  if (rules.length === 0) return []

  const lines: OpeningHoursLine[] = []
  let i = 0
  while (i < perDay.length) {
    let j = i
    while (j + 1 < perDay.length && perDay[j + 1].key === perDay[i].key) j += 1
    const first = SHORT[perDay[i].day]
    const last = SHORT[perDay[j].day]
    const days = i === j ? first : j === i + 1 ? `${first} e ${last}` : `${first} a ${last}`
    lines.push({ days, hours: perDay[i].hours })
    i = j + 1
  }
  return lines
}
