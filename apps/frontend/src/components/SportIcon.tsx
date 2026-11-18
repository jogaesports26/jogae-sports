import { createElement } from 'react'
import {
  Basketball,
  BoxingGlove,
  BeachTennisRacket,
  Sneaker,
  Stopwatch,
  SoccerBall,
  TennisRacket,
  Trophy,
  Volleyball,
  Whistle,
} from '../pages/SportIcons'

// Um ícone distinto por esporte do cadastro (lib/courts.ts SPORT_OPTIONS); "Outro" e desconhecidos caem no troféu.
const ICONS: Record<string, typeof SoccerBall> = {
  FUTEBOL: SoccerBall,
  FUTSAL: Sneaker,
  SOCIETY: Whistle,
  VOLEI: Volleyball,
  BEACH_TENNIS: BeachTennisRacket,
  TENIS: TennisRacket,
  BASQUETE: Basketball,
  OUTRO: Trophy,
}

// "Outro" aceita texto livre ("Beach vôlei", "Futevôlei", "Funcional"…): casa por palavra, sem acento nem caixa.
// A ordem importa: "futevôlei" contém "volei" e "beach tennis" contém "tenis".
const KEYWORDS: [string, typeof SoccerBall][] = [
  ['futevolei', SoccerBall],
  ['beach tennis', BeachTennisRacket],
  ['beachtennis', BeachTennisRacket],
  ['volei', Volleyball],
  ['tenis', TennisRacket],
  ['futebol', SoccerBall],
  ['futsal', Sneaker],
  ['basquete', Basketball],
  ['funcional', Stopwatch],
  ['hiit', Stopwatch],
  ['luta', BoxingGlove],
  ['boxe', BoxingGlove],
]

function iconFor(sport: string): typeof SoccerBall {
  if (ICONS[sport]) return ICONS[sport]
  const text = sport.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  return KEYWORDS.find(([keyword]) => text.includes(keyword))?.[1] ?? Trophy
}

/** Decorativo: o nome do esporte sempre aparece em texto ao lado. */
export default function SportIcon({ sport }: { sport: string }) {
  return createElement(iconFor(sport))
}
