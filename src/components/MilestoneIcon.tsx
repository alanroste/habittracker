import { useState } from 'react'
import { artUrl, type CharacterSetKey } from '../lib/character'

/** A streak collectible. Greyed out until the streak that earns it is reached. */
export default function MilestoneIcon({
  set, days, earned, size = 40,
}: { set: CharacterSetKey; days: number; earned: boolean; size?: number }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        className={`grid place-items-center rounded-lg ${earned ? 'bg-warn/20 text-warn' : 'bg-surface-2 text-ink-3'}`}
        style={{ width: size, height: size }}
        aria-hidden
      >
        ★
      </div>
    )
  }

  return (
    <img
      src={artUrl(set, `milestone-${days}`)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`rounded-lg object-cover transition ${earned ? '' : 'opacity-35 grayscale'}`}
      style={{ width: size, height: size }}
    />
  )
}
