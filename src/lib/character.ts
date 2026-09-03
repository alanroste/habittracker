import type { Stats } from '../types'

/**
 * The character system. Two ladders:
 *
 *   Powered up  — climbs with your current perfect-day streak (5 levels).
 *   Depleted    — takes over the moment you miss ANY habit on a day, no matter
 *                 how much else you completed, and gets worse the longer it runs.
 *
 * Each user picks a set; the thresholds are shared, only the names, captions and
 * art differ. Art lives at /characters/<set>/<key>.webp — see
 * scripts/slice-characters.mjs and public/characters/README.md.
 */

export type CharacterSetKey = 'snoop' | 'batman' | 'luffy'

export interface Tier {
  key: string
  name: string
  caption: string
  /** Streak days for levels; consecutive missed days for depleted. */
  at: number
}

export interface Milestone {
  days: number
  name: string
}

export interface CharacterSet {
  key: CharacterSetKey
  label: string
  blurb: string
  levels: Tier[]
  depleted: Tier[]
  milestones: Milestone[]
}

/** Shared thresholds. Levels by streak; depleted by consecutive missed days. */
const LEVEL_AT = [0, 3, 7, 14, 30]
const DEPLETED_AT = [1, 2, 3, 4, 5, 7, 10]
/** Scaled to the 70-day challenge, so the last one lands on finishing it clean. */
const MILESTONE_DAYS = [3, 7, 14, 30, 50, 70]

const levels = (rows: [string, string][]): Tier[] =>
  rows.map(([name, caption], i) => ({ key: `level-${i + 1}`, name, caption, at: LEVEL_AT[i] }))

const depleted = (rows: [string, string][]): Tier[] =>
  rows.map(([name, caption], i) => ({ key: `depleted-${DEPLETED_AT[i]}`, name, caption, at: DEPLETED_AT[i] }))

const milestones = (names: string[]): Milestone[] =>
  names.map((name, i) => ({ days: MILESTONE_DAYS[i], name }))

export const CHARACTER_SETS: Record<CharacterSetKey, CharacterSet> = {
  luffy: {
    key: 'luffy',
    label: 'Luffy',
    blurb: 'Gears up as the streak grows.',
    levels: levels([
      ['Base Luffy', 'Ready for adventure. Streak begins.'],
      ['Gear 2', 'Blood pumping. Locked in.'],
      ['Gear 3', 'Big moves. Bigger habits.'],
      ['Gear 4', 'Monster discipline. No stopping now.'],
      ['Gear 5', 'Peak freedom. Peak consistency.'],
    ]),
    depleted: depleted([
      ['Overslept', 'Even pirates need sleep…'],
      ['Skipped Training', 'Tomorrow for sure.'],
      ['No Adventure', 'This is not pirate behavior.'],
      ['Losing Haki', 'Momentum is slipping…'],
      ['Crew Is Concerned', 'Bro, get it together.'],
      ['Couch Potato Captain', 'Captain of the couch.'],
      ['Lost At Sea', "Even the future Pirate King can't live like this."],
    ]),
    milestones: milestones(['Mini Straw Hat', 'Going Merry', 'Devil Fruit', 'Thousand Sunny', 'Wanted Poster', 'Pirate King Crown']),
  },
  batman: {
    key: 'batman',
    label: 'Bat Hero',
    blurb: 'Build discipline. Protect your city.',
    levels: levels([
      ['Broke Bruce', 'Barely heroic. Still showed up.'],
      ['Rooftop Vigilante', 'Momentum building. Night shift activated.'],
      ['Gadget Goblin', 'Prep mode. No problem is too small.'],
      ['Prep-Time Demon', 'He already planned for this six months ago.'],
      ['Gotham Final Boss', 'Fear itself now has a curfew.'],
    ]),
    depleted: depleted([
      ['Overslept', 'The city can wait five more minutes…'],
      ['Skipped Training', 'Crime is up. Motivation is down.'],
      ['Utility Belt Empty', 'No tools. No edge. No excuse.'],
      ['Batmobile Dead', 'Even vengeance needs maintenance.'],
      ['Alfred Is Disappointed', 'When the butler loses faith, it’s bad.'],
      ['Gotham Noticed', "You weren't absent. You were missed."],
      ['Joker Took The Cave', 'Rock bottom has clown music.'],
    ]),
    milestones: milestones(['Mask', 'Batarang', 'Smoke Bombs', 'Grapple Gun', 'Armored Suit', 'City Legend']),
  },
  snoop: {
    key: 'snoop',
    label: 'Snoop',
    blurb: 'Complete your habits. Elevate the streak.',
    levels: levels([
      ['Porch Chillin’', 'Light buzz. Locked in.'],
      ['Hotbox Cruiser', 'Good vibes. Momentum building.'],
      ['Studio Wizard', 'Creative mode unlocked.'],
      ['Intergalactic Float', 'Higher plane. Maximum chill.'],
      ['Cloud Kingdom Boss', 'Fully ascended.'],
    ]),
    depleted: depleted([
      ['Low Supply', 'Running low.'],
      ['Pocket Check', 'There was supposed to be more.'],
      ['Crumb Detective', 'Desperate investigation.'],
      ['Dry Spell', 'No smoke. No focus.'],
      ['Snack Meltdown', 'Everything is annoying.'],
      ['Existential Crisis', 'Rock bottom energy.'],
      ['The Void', 'System failure.'],
    ]),
    milestones: milestones(['Tiny Blunt', 'Gold Lighter', 'Plush Robe', 'Lowrider Keys', 'Cloud Throne', 'Cosmic Crown']),
  },
}

export const DEFAULT_SET: CharacterSetKey = 'luffy'

export function getSet(key: string | null | undefined): CharacterSet {
  return CHARACTER_SETS[(key as CharacterSetKey) in CHARACTER_SETS ? (key as CharacterSetKey) : DEFAULT_SET]
}

/** Where a tier's artwork lives. */
export function artUrl(set: CharacterSetKey, tierKey: string) {
  return `/characters/${set}/${tierKey}.webp`
}

export type CharacterState =
  | { mode: 'powered'; set: CharacterSet; tier: Tier; level: number; streak: number; next: Tier | null; toNext: number; progress: number }
  | { mode: 'depleted'; set: CharacterSet; tier: Tier; daysMissed: number; level: number }

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
  const set = getSet(stats.user.character_set)
  const missed = consecutiveMissedDays(stats)
  if (missed > 0) {
    const { tier, index } = tierFor(set.depleted, missed)
    return { mode: 'depleted', set, tier, daysMissed: missed, level: index + 1 }
  }
  const streak = stats.streak.current
  const { tier, index } = tierFor(set.levels, streak)
  const next = set.levels[index + 1] ?? null
  const span = next ? next.at - tier.at : 1
  return {
    mode: 'powered',
    set,
    tier,
    level: index + 1,
    streak,
    next,
    toNext: next ? next.at - streak : 0,
    progress: next ? Math.min(1, (streak - tier.at) / span) : 1,
  }
}

/** Milestones stay earned once you've hit them, so they key off your best streak. */
export function milestoneProgress(stats: Stats) {
  const set = getSet(stats.user.character_set)
  const best = stats.streak.best
  const next = set.milestones.find((m) => best < m.days) ?? null
  return { set, best, next, all: set.milestones.map((m) => ({ ...m, earned: best >= m.days })) }
}
