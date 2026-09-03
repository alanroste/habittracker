import type { Stats } from '../types'

/**
 * The character system. Two ladders:
 *
 *   Powered up  — climbs with your current perfect-day streak (5 levels).
 *   Depleted    — takes over the moment you miss ANY habit on a day, no matter
 *                 how much else you completed, and gets worse the longer it runs.
 *
 * Art is pluggable: drop an image at the tier's `image` path (see
 * public/characters/README.md) and it replaces the drawn artwork.
 */

export interface Tier {
  key: string
  name: string
  caption: string
  /** Lower bound: streak days for levels, consecutive missed days for depleted. */
  at: number
  image: string
}

export const LEVELS: Tier[] = [
  { key: 'level-1', name: 'Porch Chillin’', caption: 'Light buzz. Locked in.', at: 0, image: '/characters/level-1.png' },
  { key: 'level-2', name: 'Hotbox Cruiser', caption: 'Good vibes. Momentum building.', at: 3, image: '/characters/level-2.png' },
  { key: 'level-3', name: 'Studio Wizard', caption: 'Creative mode unlocked.', at: 7, image: '/characters/level-3.png' },
  { key: 'level-4', name: 'Intergalactic Float', caption: 'Higher plane. Maximum chill.', at: 14, image: '/characters/level-4.png' },
  { key: 'level-5', name: 'Cloud Kingdom Boss', caption: 'Fully ascended.', at: 30, image: '/characters/level-5.png' },
]

export const DEPLETED: Tier[] = [
  { key: 'depleted-1', name: 'Low Supply', caption: 'Running low.', at: 1, image: '/characters/depleted-1.png' },
  { key: 'depleted-2', name: 'Pocket Check', caption: 'There was supposed to be more.', at: 2, image: '/characters/depleted-2.png' },
  { key: 'depleted-3', name: 'Crumb Detective', caption: 'Desperate investigation.', at: 3, image: '/characters/depleted-3.png' },
  { key: 'depleted-4', name: 'Dry Spell', caption: 'No smoke. No focus.', at: 4, image: '/characters/depleted-4.png' },
  { key: 'depleted-5', name: 'Snack Meltdown', caption: 'Everything is annoying.', at: 5, image: '/characters/depleted-5.png' },
  { key: 'depleted-7', name: 'Existential Crisis', caption: 'Rock bottom energy.', at: 7, image: '/characters/depleted-7.png' },
  { key: 'depleted-10', name: 'The Void', caption: 'System failure.', at: 10, image: '/characters/depleted-10.png' },
]

export interface Milestone {
  days: number
  name: string
  sub: string
}

/** Scaled to the 70-day challenge, so the last one lands on finishing it clean. */
export const MILESTONES: Milestone[] = [
  { days: 3, name: 'Tiny Blunt', sub: 'of Discipline' },
  { days: 7, name: 'Gold Lighter', sub: 'of Consistency' },
  { days: 14, name: 'Plush Robe', sub: 'of Commitment' },
  { days: 30, name: 'Lowrider Keys', sub: 'of Freedom' },
  { days: 50, name: 'Cloud Throne', sub: 'of Greatness' },
  { days: 70, name: 'Cosmic Crown', sub: 'of Legend' },
]

export type CharacterState =
  | { mode: 'powered'; tier: Tier; level: number; streak: number; next: Tier | null; toNext: number; progress: number }
  | { mode: 'depleted'; tier: Tier; daysMissed: number; level: number }

/**
 * Consecutive days ending now where at least one daily habit was missed or never
 * logged. Today only counts once an actual miss is logged — while it's still
 * open you haven't blown it yet, so we look through to yesterday.
 */
export function consecutiveMissedDays(stats: Stats): number {
  const newestFirst = [...stats.daily_history].sort((a, b) => (a.date < b.date ? 1 : -1))
  let run = 0
  for (const d of newestFirst) {
    if (d.date === stats.today) {
      if (d.misses > 0) { run++; continue }  // already blown today
      if (d.pending > 0) continue            // day isn't over; look further back
      break                                  // today is clean and done
    }
    if (d.misses > 0 || d.unlogged > 0) run++
    else break
  }
  return run
}

function tierFor(tiers: Tier[], value: number): { tier: Tier; index: number } {
  let index = 0
  for (let i = 0; i < tiers.length; i++) if (value >= tiers[i].at) index = i
  return { tier: tiers[index], index }
}

export function characterState(stats: Stats): CharacterState {
  const missed = consecutiveMissedDays(stats)
  if (missed > 0) {
    const { tier, index } = tierFor(DEPLETED, missed)
    return { mode: 'depleted', tier, daysMissed: missed, level: index + 1 }
  }
  const streak = stats.streak.current
  const { tier, index } = tierFor(LEVELS, streak)
  const next = LEVELS[index + 1] ?? null
  const toNext = next ? next.at - streak : 0
  const span = next ? next.at - tier.at : 1
  return {
    mode: 'powered',
    tier,
    level: index + 1,
    streak,
    next,
    toNext,
    progress: next ? Math.min(1, (streak - tier.at) / span) : 1,
  }
}

/** Milestones stay earned once you've hit them, so they key off your best streak. */
export function milestoneProgress(stats: Stats) {
  const best = stats.streak.best
  const current = stats.streak.current
  const unlocked = MILESTONES.filter((m) => best >= m.days)
  const next = MILESTONES.find((m) => best < m.days) ?? null
  return { best, current, unlocked, next, all: MILESTONES.map((m) => ({ ...m, earned: best >= m.days })) }
}
