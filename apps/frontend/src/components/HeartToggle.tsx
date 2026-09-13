import { useState } from 'react'
import { isFavoriteCourt, toggleFavoriteCourt } from '../lib/favorites'
import './HeartToggle.css'

interface HeartToggleProps {
  courtId: string
  className?: string
}

export default function HeartToggle({ courtId, className }: HeartToggleProps) {
  const [favorite, setFavorite] = useState(() => isFavoriteCourt(courtId))

  function handleClick(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    setFavorite(toggleFavoriteCourt(courtId))
  }

  return (
    <button
      type="button"
      className={`heart-toggle${favorite ? ' heart-toggle--active' : ''}${className ? ` ${className}` : ''}`}
      onClick={handleClick}
      aria-label={favorite ? 'Remover dos favoritos' : 'Favoritar quadra'}
      aria-pressed={favorite}
    >
      <svg viewBox="0 0 24 24" fill={favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path
          d="M12 21s-6.7-4.35-9.3-8.2C1.1 10.1 1.6 6.6 4.4 5c2.2-1.25 4.8-.5 6.1 1.4.4.6.7 1.2 1.5 1.2s1.1-.6 1.5-1.2c1.3-1.9 3.9-2.65 6.1-1.4 2.8 1.6 3.3 5.1 1.7 7.8C18.7 16.65 12 21 12 21z"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
