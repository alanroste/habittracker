import { useState } from 'react'
import { artUrl, type CharacterState } from '../lib/character'

/**
 * The tier's artwork, shown full width — the panels carry their own printed
 * title and caption, so they need the room to stay readable.
 *
 * Falls back to a plain badge if a set is missing a tile, so a partial art set
 * still works rather than showing a broken image.
 */
export default function CharacterArt({ state }: { state: CharacterState }) {
  const [failed, setFailed] = useState(false)
  const depleted = state.mode === 'depleted'

  if (failed) {
    return (
      <div className={`flex items-center gap-3 p-4 ${depleted ? 'bg-bad/10' : 'bg-good/10'}`}>
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-xl font-black ${
          depleted ? 'bg-bad/20 text-bad' : 'bg-good/20 text-good'
        }`}>
          {depleted ? '!' : state.level}
        </span>
        <div className="min-w-0">
          <div className="font-bold">{state.tier.name}</div>
          <div className="text-sm text-ink-2">{state.tier.caption}</div>
        </div>
      </div>
    )
  }

  return (
    <img
      src={artUrl(state.set.key, state.tier.key)}
      alt={`${state.tier.name} — ${state.tier.caption}`}
      onError={() => setFailed(true)}
      className="block w-full"
    />
  )
}
