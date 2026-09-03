import { useState } from 'react'
import { artUrl, type CharacterState } from '../lib/character'

/**
 * The tier's artwork. Falls back to a drawn placeholder if a set is missing a
 * tile, so a partial art set still works rather than showing a broken image.
 */
export default function CharacterArt({ state, size = 220 }: { state: CharacterState; size?: number }) {
  const [failed, setFailed] = useState(false)
  const depleted = state.mode === 'depleted'
  const src = artUrl(state.set.key, state.tier.key)

  if (failed) {
    return (
      <div
        className={`grid place-items-center rounded-2xl border ${
          depleted ? 'border-bad/40 bg-bad/10' : 'border-good/40 bg-good/10'
        }`}
        style={{ width: size, height: size }}
        aria-label={state.tier.name}
      >
        <span className={`text-3xl font-black ${depleted ? 'text-bad' : 'text-good'}`}>
          {depleted ? '!' : state.level}
        </span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={state.tier.name}
      width={size}
      height={size}
      loading="eager"
      onError={() => setFailed(true)}
      className="rounded-2xl object-cover"
      style={{ width: size, height: size }}
    />
  )
}
