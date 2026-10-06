import {
  Basketball,
  BeachTennisRacket,
  Sneaker,
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

/** Decorativo: o nome do esporte sempre aparece em texto ao lado. */
export default function SportIcon({ sport }: { sport: string }) {
  const Icon = ICONS[sport] ?? Trophy
  return <Icon />
}
