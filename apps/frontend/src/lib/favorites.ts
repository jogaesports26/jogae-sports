const STORAGE_KEY = 'jogae_favorite_courts'

function readFavorites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function writeFavorites(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // localStorage indisponível (ex: modo privado) — favoritar vira uma ação sem efeito
  }
}

export function isFavoriteCourt(courtId: string): boolean {
  return readFavorites().includes(courtId)
}

export function toggleFavoriteCourt(courtId: string): boolean {
  const current = readFavorites()
  const isFavorite = current.includes(courtId)
  writeFavorites(isFavorite ? current.filter((id) => id !== courtId) : [...current, courtId])
  return !isFavorite
}
