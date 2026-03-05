export default function KeysDecoration({ className }: { className?: string }) {
  const primary = 'hsl(191, 100%, 46%)'
  const secondary = 'hsl(207, 85%, 42%)'

  return (
    <svg
      viewBox="30 5 90 110"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Key 2 — smaller, behind, rotated so tip goes left */}
      <g transform="rotate(22, 70, 38)">
        <circle cx="70" cy="57" r="9" fill="none" stroke="#90A4AE" strokeWidth="2" />
        <rect x="67.5" y="66" width="5" height="36" rx="2" fill="#90A4AE" />
        <rect x="62.5" y="72" width="5"   height="3"   rx="1" fill="#90A4AE" />
        <rect x="62.5" y="79" width="4.5" height="3.5" rx="1" fill="#90A4AE" />
        <rect x="62.5" y="87" width="5"   height="3"   rx="1" fill="#90A4AE" />
      </g>

      {/* Key 1 — larger, front, rotated so tip goes right */}
      <g transform="rotate(-22, 70, 38)">
        <circle cx="70" cy="57" r="11" fill="none" stroke="#78909C" strokeWidth="2.5" />
        <rect x="67" y="68" width="6" height="44" rx="2" fill="#78909C" />
        <rect x="73" y="74" width="4.5" height="3.5" rx="1" fill="#78909C" />
        <rect x="73" y="82" width="6"   height="4.5" rx="1" fill="#78909C" />
        <rect x="73" y="91" width="4.5" height="3.5" rx="1" fill="#78909C" />
        <rect x="73" y="100" width="5"  height="4"   rx="1" fill="#78909C" />
      </g>

      {/* Keyring — rendered on top so it appears to loop through the key bows */}
      <circle cx="70" cy="38" r="14" fill="none" stroke="#607D8B" strokeWidth="3.5" />

      {/* Small connector ring linking house keychain to main ring */}
      <circle cx="80" cy="27" r="3.5" fill="none" stroke="#607D8B" strokeWidth="2" />

      {/* House keychain */}
      <g transform="translate(73, 8)">
        {/* Roof */}
        <polygon points="7,0 15,9 -1,9" fill={secondary} />
        {/* Body */}
        <rect x="0" y="8" width="14" height="9" rx="1.5" fill={primary} />
        {/* Door/window */}
        <rect x="5" y="11" width="4" height="4.5" rx="0.5" fill="white" fillOpacity="0.85" />
      </g>
    </svg>
  )
}
