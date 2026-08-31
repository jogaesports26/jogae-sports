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
    <svg className={className} style={style} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path
        d="M13 6a5 5 0 0 1 10 0v3a5 5 0 0 1 5 5v4a10 10 0 0 1-10 10h-2a9 9 0 0 1-9-9v-4a3 3 0 0 1 3-3 3 3 0 0 1 3 3"
        stroke={STROKE}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M8 26h20v3a5 5 0 0 1-5 5H13a5 5 0 0 1-5-5v-3Z" stroke={STROKE} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M13 9v5M18 9v6M23 12v4" stroke={STROKE} strokeWidth="1.6" strokeLinecap="round" />
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
  Whistle,
  Trophy,
  Stopwatch,
  BoxingGlove,
]
