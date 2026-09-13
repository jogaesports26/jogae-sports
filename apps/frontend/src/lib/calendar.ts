function toGoogleCalendarDate(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

/** Link "Adicionar ao Google Calendar" sem OAuth — só a URL padrão do Google com os parâmetros do evento. */
export function buildGoogleCalendarUrl(params: {
  title: string
  details?: string
  location?: string
  startsAt: Date | string
  endsAt: Date | string
}): string {
  const query = new URLSearchParams({
    action: 'TEMPLATE',
    text: params.title,
    dates: `${toGoogleCalendarDate(params.startsAt)}/${toGoogleCalendarDate(params.endsAt)}`,
  })
  if (params.details) query.set('details', params.details)
  if (params.location) query.set('location', params.location)
  return `https://calendar.google.com/calendar/render?${query.toString()}`
}
