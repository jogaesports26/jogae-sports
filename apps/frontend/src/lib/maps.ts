/** Link do Google Maps com a rota até o endereço (abre o app no celular). Sem endereço, não há link. */
export function directionsUrl(address: string | null | undefined): string | null {
  const clean = address?.trim()
  if (!clean) return null
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(clean)}`
}
