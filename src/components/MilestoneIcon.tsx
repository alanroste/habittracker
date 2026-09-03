/**
 * The six streak collectibles. Drawn rather than emoji so they stay consistent
 * across phones; a custom image at /characters/milestone-<days>.png overrides one.
 */
import { useState } from 'react'

const GOLD = '#facc15'
const GOLD_DEEP = '#a16207'

export default function MilestoneIcon({ days, earned, size = 34 }: { days: number; earned: boolean; size?: number }) {
  const [failed, setFailed] = useState(false)
  const fill = earned ? GOLD : '#4b5563'
  const stroke = earned ? GOLD_DEEP : '#374151'

  if (!failed) {
    return (
      <img
        src={`/characters/milestone-${days}.png`}
        alt=""
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className={earned ? '' : 'opacity-40 grayscale'}
        style={{ width: size, height: size, objectFit: 'contain' }}
      />
    )
  }

  const common = { width: size, height: size, viewBox: '0 0 40 40', 'aria-hidden': true as const }
  const dim = earned ? 1 : 0.5

  switch (days) {
    case 3: // tiny blunt
      return (
        <svg {...common} opacity={dim}>
          <rect x="8" y="20" width="22" height="6" rx="3" fill="#f5f5f4" transform="rotate(-20 8 20)" />
          <circle cx="30" cy="13" r="3" fill={earned ? '#f97316' : fill} />
          <path d="M31 8 q 3 -4 0 -7" fill="none" stroke={earned ? '#a3a3a3' : fill} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )
    case 7: // lighter
      return (
        <svg {...common} opacity={dim}>
          <rect x="12" y="16" width="16" height="20" rx="3" fill={fill} stroke={stroke} strokeWidth="1.4" />
          <rect x="15" y="12" width="10" height="5" rx="1.5" fill={stroke} />
          <path d="M20 12 c 4 -4 1 -6 0 -8 c -1 3 -4 4 0 8 z" fill={earned ? '#f97316' : fill} />
        </svg>
      )
    case 14: // robe
      return (
        <svg {...common} opacity={dim}>
          <path d="M13 10 l7 4 7 -4 6 5 -3 5 -2 -2 v14 H12 V18 l-2 2 -3 -5 z" fill={earned ? '#7c3aed' : fill} stroke={earned ? '#4c1d95' : stroke} strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M20 14 v18" stroke={earned ? '#4c1d95' : stroke} strokeWidth="1.3" />
        </svg>
      )
    case 30: // keys
      return (
        <svg {...common} opacity={dim}>
          <circle cx="14" cy="15" r="6.5" fill="none" stroke={fill} strokeWidth="3" />
          <path d="M18 19 l 12 12" stroke={fill} strokeWidth="3" strokeLinecap="round" />
          <path d="M25 26 l 4 4 M22 29 l 3 3" stroke={fill} strokeWidth="3" strokeLinecap="round" />
        </svg>
      )
    case 50: // throne on a cloud
      return (
        <svg {...common} opacity={dim}>
          <path d="M13 8 h14 v13 h3 v9 H10 v-9 h3 z" fill={fill} stroke={stroke} strokeWidth="1.3" strokeLinejoin="round" />
          <ellipse cx="20" cy="33" rx="13" ry="4.5" fill={earned ? '#e5e7eb' : '#374151'} />
        </svg>
      )
    default: // 70 — cosmic crown
      return (
        <svg {...common} opacity={dim}>
          <path d="M8 28 L6 12 l7 6 7 -10 7 10 7 -6 -2 16 z" fill={fill} stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
          <rect x="8" y="28" width="24" height="4" rx="1.5" fill={stroke} />
          <circle cx="20" cy="15" r="2" fill={earned ? '#a855f7' : stroke} />
        </svg>
      )
  }
}
