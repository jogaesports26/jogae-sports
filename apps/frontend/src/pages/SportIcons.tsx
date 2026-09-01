const STROKE = '#25D366'

type IconProps = { className?: string; style?: React.CSSProperties }

export function SoccerBall({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="17" stroke={STROKE} strokeWidth="2.3" />
      <path
        d="M20 11l6.5 4.7-2.5 7.6h-8l-2.5-7.6L20 11Z"
        stroke={STROKE}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M20 11V4.5M26.5 15.7l6-4M24 23.3l2.3 7.2M13.5 15.7l-6-4M16 23.3l-2.3 7.2"
        stroke={STROKE}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Basketball({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="17" stroke={STROKE} strokeWidth="2.3" />
      <path d="M20 3v34M3 20h34" stroke={STROKE} strokeWidth="1.6" />
      <path
        d="M7.5 8c4.5 4.3 4.5 19.7 0 24M32.5 8c-4.5 4.3-4.5 19.7 0 24"
        stroke={STROKE}
        strokeWidth="1.6"
      />
    </svg>
  )
}

export function Volleyball({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="17" stroke={STROKE} strokeWidth="2.3" />
      <path
        d="M20 3c8 5 8 29 0 34M6 12c8 4 20 4 28 3M6 25c8-4 20-4 28-3"
        stroke={STROKE}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function TennisBall({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="17" stroke={STROKE} strokeWidth="2.5" />
      <path
        d="M5 9c6 3 6 19 0 22M35 9c-6 3-6 19 0 22"
        stroke={STROKE}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function TennisRacket({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 34 56" fill="none" aria-hidden="true">
      <ellipse cx="17" cy="16" rx="12.5" ry="13.5" stroke={STROKE} strokeWidth="2.3" />
      <path
        d="M10.5 4v24M17 3v26M23.5 4v24M6 10h22M6 16h22M6 22h22"
        stroke={STROKE}
        strokeWidth="1.3"
      />
      <path d="M17 29.5v10.5" stroke={STROKE} strokeWidth="3.2" strokeLinecap="round" />
      <rect x="13.5" y="40" width="7" height="12" rx="3.5" stroke={STROKE} strokeWidth="2.3" />
    </svg>
  )
}

export function BadmintonRacket({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 30 58" fill="none" aria-hidden="true">
      <ellipse cx="15" cy="14" rx="10.5" ry="13" stroke={STROKE} strokeWidth="2.1" />
      <path
        d="M9 4v20M15 2v24M21 4v20M6 8h18M6 14h18M6 20h18"
        stroke={STROKE}
        strokeWidth="1.1"
      />
      <path d="M15 26.5v13" stroke={STROKE} strokeWidth="2.8" strokeLinecap="round" />
      <rect x="11.5" y="39" width="7" height="14" rx="3.5" stroke={STROKE} strokeWidth="2.1" />
    </svg>
  )
}

export function Whistle({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 44 32" fill="none" aria-hidden="true">
      <path
        d="M15 8h17a7 7 0 1 1 0 14H19a11 11 0 1 1 0-22"
        stroke={STROKE}
        strokeWidth="2.3"
        strokeLinejoin="round"
      />
      <circle cx="15" cy="17" r="3.2" stroke={STROKE} strokeWidth="1.8" />
      <path d="M8 9v-4M8 5h5" stroke={STROKE} strokeWidth="1.8" strokeLinecap="round" />
      <rect x="32" y="12" width="4" height="6" rx="1" fill={STROKE} />
    </svg>
  )
}

export function Trophy({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 36 44" fill="none" aria-hidden="true">
      <path
        d="M10 5h16v10a8 8 0 0 1-16 0V5Z"
        stroke={STROKE}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M10 8H5a5 5 0 0 0 5 8M26 8h5a5 5 0 0 1-5 8"
        stroke={STROKE}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M18 23v7" stroke={STROKE} strokeWidth="2.2" />
      <path d="M11 37h14M13 30h10l1.5 7h-13L13 30Z" stroke={STROKE} strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  )
}

export function Stopwatch({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 40 44" fill="none" aria-hidden="true">
      <circle cx="20" cy="25" r="14" stroke={STROKE} strokeWidth="2.3" />
      <path d="M20 25V15M20 25l7 4" stroke={STROKE} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15 3h10M20 3v6" stroke={STROKE} strokeWidth="2.1" strokeLinecap="round" />
      <path d="M32 8l3 3" stroke={STROKE} strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  )
}

export function BoxingGlove({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 36 40" fill="none" aria-hidden="true">
      <path
        d="M22 4a8 8 0 0 0-8 8v7a8 8 0 0 0 8 8 8 8 0 0 0 8-8v-7a8 8 0 0 0-8-8Z"
        stroke={STROKE}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M9 12a4.5 4.5 0 0 1 5 4.5V19a4.5 4.5 0 0 1-9 0v-3a4.5 4.5 0 0 1 4-4Z"
        stroke={STROKE}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M11 25h22v3a7 7 0 0 1-7 7H18a7 7 0 0 1-7-7v-3Z"
        stroke={STROKE}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Shuttlecock({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 28 40" fill="none" aria-hidden="true">
      <path
        d="M14 27 4 4Q14 -2 24 4Z"
        stroke={STROKE}
        strokeWidth="2.1"
        strokeLinejoin="round"
      />
      <path d="M14 4v23M9 8l5 19M19 8l-5 19" stroke={STROKE} strokeWidth="1" />
      <circle cx="14" cy="32" r="5.5" stroke={STROKE} strokeWidth="2.1" />
    </svg>
  )
}

export function BeachTennisRacket({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 34 54" fill="none" aria-hidden="true">
      <path
        d="M17 3C9 3 5 9 5 18s6 15 12 15 12-6 12-15S25 3 17 3Z"
        stroke={STROKE}
        strokeWidth="2.3"
        strokeLinejoin="round"
      />
      <circle cx="11" cy="12" r="1.4" fill={STROKE} />
      <circle cx="17" cy="10" r="1.4" fill={STROKE} />
      <circle cx="23" cy="12" r="1.4" fill={STROKE} />
      <circle cx="9" cy="18" r="1.4" fill={STROKE} />
      <circle cx="17" cy="17" r="1.4" fill={STROKE} />
      <circle cx="25" cy="18" r="1.4" fill={STROKE} />
      <circle cx="11" cy="24" r="1.4" fill={STROKE} />
      <circle cx="17" cy="24" r="1.4" fill={STROKE} />
      <circle cx="23" cy="24" r="1.4" fill={STROKE} />
      <path d="M17 33v11" stroke={STROKE} strokeWidth="3" strokeLinecap="round" />
      <rect x="13.5" y="44" width="7" height="9" rx="3.5" stroke={STROKE} strokeWidth="2.1" />
    </svg>
  )
}

export function VolleyballNet({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 64 30" fill="none" aria-hidden="true">
      <path d="M4 2v26M4 2h56" stroke={STROKE} strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M4 6h56M4 6v14h56V6M12 6v14M20 6v14M28 6v14M36 6v14M44 6v14M52 6v14M60 6v14"
        stroke={STROKE}
        strokeWidth="1"
      />
    </svg>
  )
}

export function Sneaker({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 52 30" fill="none" aria-hidden="true">
      <path
        d="M2 22c0-5 3-7 7-9l9-5 4 4 8-2 6 4h10c3 0 4 2 4 4v4a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4Z"
        stroke={STROKE}
        strokeWidth="2.1"
        strokeLinejoin="round"
      />
      <path d="M18 8l4 4M26 6l3.5 5.5M12 15h30" stroke={STROKE} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function Skateboard({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 60 26" fill="none" aria-hidden="true">
      <rect x="2" y="8" width="56" height="10" rx="5" stroke={STROKE} strokeWidth="2.1" />
      <path d="M14 18v4M46 18v4" stroke={STROKE} strokeWidth="2.1" strokeLinecap="round" />
      <path d="M7 22h14M39 22h14" stroke={STROKE} strokeWidth="2.1" strokeLinecap="round" />
      <circle cx="10.5" cy="22" r="2.6" stroke={STROKE} strokeWidth="1.6" />
      <circle cx="17.5" cy="22" r="2.6" stroke={STROKE} strokeWidth="1.6" />
      <circle cx="42.5" cy="22" r="2.6" stroke={STROKE} strokeWidth="1.6" />
      <circle cx="49.5" cy="22" r="2.6" stroke={STROKE} strokeWidth="1.6" />
    </svg>
  )
}

export function ClockIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <circle cx="18" cy="18" r="15" stroke={STROKE} strokeWidth="2.2" />
      <path d="M18 10v8l6 4" stroke={STROKE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CalendarIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="30" height="26" rx="4" stroke={STROKE} strokeWidth="2.2" />
      <path d="M3 14h30M11 3v6M25 3v6" stroke={STROKE} strokeWidth="2.2" strokeLinecap="round" />
      <rect x="13" y="19" width="6" height="6" rx="1.5" fill={STROKE} />
    </svg>
  )
}

export function FilterIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 36 26" fill="none" aria-hidden="true">
      <path d="M2 4h32M2 13h32M2 22h32" stroke={STROKE} strokeWidth="2.1" strokeLinecap="round" />
      <circle cx="12" cy="4" r="3" stroke={STROKE} strokeWidth="2.1" />
      <circle cx="24" cy="13" r="3" stroke={STROKE} strokeWidth="2.1" />
      <circle cx="15" cy="22" r="3" stroke={STROKE} strokeWidth="2.1" />
    </svg>
  )
}

export const SPORT_ICON_COMPONENTS = [
  SoccerBall,
  Basketball,
  Volleyball,
  TennisBall,
  TennisRacket,
  BadmintonRacket,
  BeachTennisRacket,
  Shuttlecock,
  VolleyballNet,
  Sneaker,
  Skateboard,
  Whistle,
  Trophy,
  Stopwatch,
  BoxingGlove,
  ClockIcon,
  CalendarIcon,
  FilterIcon,
]
