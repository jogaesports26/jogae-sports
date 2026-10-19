// Cálculos puros da ficha do cliente (sem rede), para a tela de Clientes e seus testes.

export interface InsightReservation {
  startsAt: string
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
  court: { name: string }
}

export interface CustomerInsights {
  /** Data da primeira reserva (qualquer status): "cliente desde". */
  firstAt: string | null
  /** Quadra mais reservada, sem contar as canceladas. */
  favoriteCourt: string | null
  completed: number
  cancelled: number
  noShows: number
}

export function customerInsights(reservations: InsightReservation[]): CustomerInsights {
  const counts = new Map<string, number>()
  let firstAt: string | null = null
  let completed = 0
  let cancelled = 0
  let noShows = 0
  for (const r of reservations) {
    if (firstAt === null || r.startsAt < firstAt) firstAt = r.startsAt
    if (r.status === 'CANCELLED') {
      cancelled += 1
      continue
    }
    if (r.status === 'COMPLETED') completed += 1
    if (r.status === 'NO_SHOW') noShows += 1
    counts.set(r.court.name, (counts.get(r.court.name) ?? 0) + 1)
  }
  let favoriteCourt: string | null = null
  let best = 0
  for (const [name, count] of counts) {
    if (count > best) {
      best = count
      favoriteCourt = name
    }
  }
  return { firstAt, favoriteCourt, completed, cancelled, noShows }
}

/** Gasto médio por reserva (0 quando ainda não há reservas). */
export function averageTicket(totalSpent: number, totalReservations: number): number {
  return totalReservations > 0 ? totalSpent / totalReservations : 0
}

/** Link do WhatsApp para um telefone brasileiro (DDD + número); null se o número não for válido. */
export function whatsappLink(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (digits.length !== 10 && digits.length !== 11) return null
  return `https://wa.me/55${digits}`
}
