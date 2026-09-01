export default function DeviceMockup({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 480 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* laptop base */}
      <path d="M50 250h300l14 20H36l14-20Z" fill="#1A237E" fillOpacity="0.12" />
      <rect x="20" y="266" width="360" height="8" rx="4" fill="#1A237E" fillOpacity="0.18" />

      {/* laptop screen */}
      <rect x="34" y="18" width="312" height="204" rx="12" fill="#1A237E" />
      <rect x="44" y="28" width="292" height="184" rx="6" fill="#F5F5F5" />

      {/* sidebar */}
      <rect x="44" y="28" width="46" height="184" rx="6" fill="#1A237E" />
      <circle cx="67" cy="46" r="7" fill="#FFFFFF" fillOpacity="0.9" />
      <rect x="54" y="66" width="26" height="4" rx="2" fill="#FFFFFF" fillOpacity="0.55" />
      <rect x="54" y="78" width="26" height="4" rx="2" fill="#FFFFFF" fillOpacity="0.35" />
      <rect x="54" y="90" width="26" height="4" rx="2" fill="#FFFFFF" fillOpacity="0.35" />
      <rect x="54" y="102" width="26" height="4" rx="2" fill="#FFFFFF" fillOpacity="0.35" />

      {/* kanban columns */}
      <rect x="100" y="40" width="70" height="14" rx="4" fill="#1E88E5" />
      <rect x="178" y="40" width="70" height="14" rx="4" fill="#25D366" />
      <rect x="256" y="40" width="70" height="14" rx="4" fill="#FFC107" />

      <g>
        <rect x="100" y="62" width="70" height="30" rx="5" fill="#FFFFFF" stroke="#1A237E" strokeOpacity="0.12" />
        <rect x="106" y="68" width="40" height="4" rx="2" fill="#1A237E" fillOpacity="0.4" />
        <rect x="106" y="76" width="26" height="4" rx="2" fill="#1A237E" fillOpacity="0.2" />
        <rect x="100" y="98" width="70" height="30" rx="5" fill="#FFFFFF" stroke="#1A237E" strokeOpacity="0.12" />
        <rect x="106" y="104" width="40" height="4" rx="2" fill="#1A237E" fillOpacity="0.4" />
        <rect x="106" y="112" width="26" height="4" rx="2" fill="#1A237E" fillOpacity="0.2" />
      </g>

      <g>
        <rect x="178" y="62" width="70" height="30" rx="5" fill="#FFFFFF" stroke="#1A237E" strokeOpacity="0.12" />
        <rect x="184" y="68" width="40" height="4" rx="2" fill="#1A237E" fillOpacity="0.4" />
        <rect x="184" y="76" width="26" height="4" rx="2" fill="#1A237E" fillOpacity="0.2" />
      </g>

      <g>
        <rect x="256" y="62" width="70" height="30" rx="5" fill="#FFFFFF" stroke="#1A237E" strokeOpacity="0.12" />
        <rect x="262" y="68" width="40" height="4" rx="2" fill="#1A237E" fillOpacity="0.4" />
        <rect x="262" y="76" width="26" height="4" rx="2" fill="#1A237E" fillOpacity="0.2" />
        <rect x="256" y="98" width="70" height="30" rx="5" fill="#FFFFFF" stroke="#1A237E" strokeOpacity="0.12" />
        <rect x="262" y="104" width="40" height="4" rx="2" fill="#1A237E" fillOpacity="0.4" />
        <rect x="262" y="112" width="26" height="4" rx="2" fill="#1A237E" fillOpacity="0.2" />
      </g>

      {/* small chart at bottom of screen */}
      <rect x="100" y="150" width="226" height="46" rx="6" fill="#FFFFFF" stroke="#1A237E" strokeOpacity="0.12" />
      <path
        d="M112 182l20-14 18 8 20-18 18 12 20-20 18 16"
        stroke="#1E88E5"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* phone */}
      <rect x="356" y="70" width="104" height="196" rx="16" fill="#1A237E" />
      <rect x="364" y="82" width="88" height="172" rx="8" fill="#F5F5F5" />
      <rect x="364" y="82" width="88" height="30" rx="8" fill="#1E88E5" />
      <circle cx="378" cy="97" r="5" fill="#FFFFFF" fillOpacity="0.9" />
      <rect x="390" y="93" width="40" height="4" rx="2" fill="#FFFFFF" fillOpacity="0.8" />
      <rect x="390" y="101" width="26" height="3" rx="1.5" fill="#FFFFFF" fillOpacity="0.6" />

      <rect x="372" y="122" width="72" height="26" rx="5" fill="#FFFFFF" stroke="#1A237E" strokeOpacity="0.12" />
      <rect x="378" y="128" width="34" height="4" rx="2" fill="#1A237E" fillOpacity="0.4" />
      <rect x="378" y="136" width="50" height="4" rx="2" fill="#1A237E" fillOpacity="0.2" />
      <circle cx="432" cy="135" r="6" fill="#25D366" fillOpacity="0.25" />
      <path d="M429 135l2 2 4-4" stroke="#25D366" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />

      <rect x="372" y="154" width="72" height="26" rx="5" fill="#FFFFFF" stroke="#1A237E" strokeOpacity="0.12" />
      <rect x="378" y="160" width="34" height="4" rx="2" fill="#1A237E" fillOpacity="0.4" />
      <rect x="378" y="168" width="50" height="4" rx="2" fill="#1A237E" fillOpacity="0.2" />
      <circle cx="432" cy="167" r="6" fill="#FFC107" fillOpacity="0.25" />

      <rect x="372" y="186" width="72" height="26" rx="5" fill="#FFFFFF" stroke="#1A237E" strokeOpacity="0.12" />
      <rect x="378" y="192" width="34" height="4" rx="2" fill="#1A237E" fillOpacity="0.4" />
      <rect x="378" y="200" width="50" height="4" rx="2" fill="#1A237E" fillOpacity="0.2" />
      <circle cx="432" cy="199" r="6" fill="#1E88E5" fillOpacity="0.25" />
    </svg>
  )
}
