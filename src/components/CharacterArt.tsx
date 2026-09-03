import { useState } from 'react'
import type { CharacterState } from '../lib/character'

/**
 * Drawn character art that morphs with the state. Flat and geometric on purpose —
 * it scales cleanly and never looks half-rendered.
 *
 * Any tier can be replaced by dropping a real image at its `image` path
 * (public/characters/level-3.png and friends). If the file exists it wins; if it
 * 404s we silently fall back to the drawing, so partial art sets are fine.
 */

interface Palette {
  aura: string
  glow: string
  skin: string
  hood: string
  shade: string
  accent: string
}

const POWER_PALETTES: Palette[] = [
  { aura: '#3f6212', glow: '#a3e635', skin: '#8d5524', hood: '#2f3a1c', shade: '#111827', accent: '#a3e635' },
  { aura: '#166534', glow: '#22c55e', skin: '#8d5524', hood: '#1e3a5f', shade: '#0b1220', accent: '#22c55e' },
  { aura: '#6b21a8', glow: '#c084fc', skin: '#8d5524', hood: '#3b0764', shade: '#0b1220', accent: '#c084fc' },
  { aura: '#3730a3', glow: '#818cf8', skin: '#8d5524', hood: '#312e81', shade: '#0b1220', accent: '#a5b4fc' },
  { aura: '#854d0e', glow: '#facc15', skin: '#8d5524', hood: '#78350f', shade: '#0b1220', accent: '#fde047' },
]

const DEPLETED_PALETTES: Palette[] = [
  { aura: '#3f3f46', glow: '#a1a1aa', skin: '#7a5230', hood: '#3f3f46', shade: '#18181b', accent: '#a1a1aa' },
  { aura: '#3f3f46', glow: '#8b8b93', skin: '#75502f', hood: '#3a3a40', shade: '#18181b', accent: '#8b8b93' },
  { aura: '#3a3a40', glow: '#7c7c85', skin: '#6f4b2c', hood: '#35353a', shade: '#18181b', accent: '#7c7c85' },
  { aura: '#3a2f2f', glow: '#8a6a6a', skin: '#6a4728', hood: '#332828', shade: '#18181b', accent: '#a16060' },
  { aura: '#402a2a', glow: '#b45c5c', skin: '#664426', hood: '#2f2222', shade: '#18181b', accent: '#c05252' },
  { aura: '#3d1f1f', glow: '#c04a4a', skin: '#5f4023', hood: '#2a1a1a', shade: '#18181b', accent: '#dc4c4c' },
  { aura: '#2a1010', glow: '#ef4444', skin: '#563a20', hood: '#1c1010', shade: '#0a0a0a', accent: '#ef4444' },
]

export default function CharacterArt({ state, size = 220 }: { state: CharacterState; size?: number }) {
  const [imageFailed, setImageFailed] = useState(false)
  const depleted = state.mode === 'depleted'
  const idx = Math.min(state.level - 1, (depleted ? DEPLETED_PALETTES : POWER_PALETTES).length - 1)
  const p = depleted ? DEPLETED_PALETTES[idx] : POWER_PALETTES[idx]
  const uid = state.tier.key

  if (!imageFailed) {
    // Try the custom image first; onError falls through to the drawing below.
    return (
      <img
        src={state.tier.image}
        alt={state.tier.name}
        width={size}
        height={size}
        onError={() => setImageFailed(true)}
        className="rounded-2xl object-cover"
        style={{ width: size, height: size }}
      />
    )
  }

  const smokeCount = depleted ? 0 : Math.min(state.level, 4)
  const stars = depleted ? 0 : state.level >= 4 ? 9 : 0

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={state.tier.name}>
      <defs>
        <radialGradient id={`aura-${uid}`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={p.glow} stopOpacity={depleted ? 0.25 : 0.75} />
          <stop offset="55%" stopColor={p.aura} stopOpacity={depleted ? 0.35 : 0.85} />
          <stop offset="100%" stopColor={p.aura} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`hood-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.hood} />
          <stop offset="100%" stopColor={p.shade} />
        </linearGradient>
      </defs>

      <circle cx="100" cy="96" r="92" fill={`url(#aura-${uid})`} />

      {/* halo rings grow with the level */}
      {!depleted &&
        Array.from({ length: state.level }, (_, i) => (
          <circle
            key={i}
            cx="100"
            cy="96"
            r={58 + i * 11}
            fill="none"
            stroke={p.glow}
            strokeOpacity={0.32 - i * 0.045}
            strokeWidth={1.5}
          />
        ))}

      {stars > 0 &&
        Array.from({ length: stars }, (_, i) => {
          const a = (i / stars) * Math.PI * 2
          return (
            <circle
              key={i}
              cx={100 + Math.cos(a) * 78}
              cy={96 + Math.sin(a) * 78}
              r={i % 3 === 0 ? 2.4 : 1.4}
              fill={p.accent}
              opacity={0.9}
            />
          )
        })}

      {/* smoke */}
      {Array.from({ length: smokeCount }, (_, i) => (
        <path
          key={i}
          d={`M${128 + i * 5} ${74 - i * 9} c 8 -9 -8 -16 2 -25`}
          fill="none"
          stroke={p.glow}
          strokeOpacity={0.5 - i * 0.08}
          strokeWidth="3"
          strokeLinecap="round"
        />
      ))}

      {/* shoulders */}
      <path d="M44 190 c 4 -34 24 -50 56 -50 s 52 16 56 50 z" fill={`url(#hood-${uid})`} />

      {/* head */}
      <ellipse cx="100" cy="102" rx="31" ry="35" fill={p.skin} />

      {/* hood / hair over the crown of the head */}
      <path d="M67 100 c 0 -26 15 -40 33 -40 s 33 14 33 40 c -8 -14 -19 -19 -33 -19 s -25 5 -33 19 z" fill={`url(#hood-${uid})`} />

      {/* shades */}
      <g>
        <rect x="72" y="94" width="24" height="15" rx="6" fill={p.shade} />
        <rect x="104" y="94" width="24" height="15" rx="6" fill={p.shade} />
        <path d="M96 100 h8" stroke={p.shade} strokeWidth="4" />
        {!depleted && <path d="M75 97 l7 0" stroke={p.accent} strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" />}
      </g>

      {/* mouth: joint + smile when powered, frown when depleted */}
      {depleted ? (
        <path d="M89 124 q 11 -8 22 0" fill="none" stroke={p.shade} strokeWidth="3" strokeLinecap="round" />
      ) : (
        <>
          <path d="M88 121 q 12 8 24 0" fill="none" stroke={p.shade} strokeWidth="3" strokeLinecap="round" />
          <rect x="112" y="115" width="22" height="5" rx="2.5" fill="#f5f5f4" transform="rotate(-18 112 115)" />
          <circle cx="133" cy="109" r="2.6" fill={p.glow} />
        </>
      )}

      {/* chain */}
      <path d="M78 150 q 22 20 44 0" fill="none" stroke={depleted ? '#6b7280' : '#facc15'} strokeWidth="3.5" strokeLinecap="round" />

      {/* crown at the top level */}
      {!depleted && state.level >= 5 && (
        <path d="M74 60 l 8 -22 9 14 9 -20 9 20 9 -14 8 22 z" fill="#facc15" stroke="#a16207" strokeWidth="1.5" strokeLinejoin="round" />
      )}

      {/* deep-depletion extras: sweat, then question marks */}
      {depleted && state.level >= 4 && (
        <path d="M138 92 c 0 6 -8 6 -8 0 c 0 -4 4 -9 4 -9 s 4 5 4 9 z" fill="#93c5fd" opacity="0.85" />
      )}
      {depleted && state.level >= 6 && (
        <>
          <text x="46" y="62" fill={p.accent} fontSize="24" fontWeight="bold" opacity="0.7">?</text>
          <text x="146" y="52" fill={p.accent} fontSize="18" fontWeight="bold" opacity="0.55">?</text>
        </>
      )}
    </svg>
  )
}
