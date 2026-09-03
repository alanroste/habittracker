import { characterState, milestoneProgress } from '../lib/character'
import type { Stats } from '../types'
import { Card } from './ui'
import CharacterArt from './CharacterArt'
import MilestoneIcon from './MilestoneIcon'

/**
 * The hero of the account dashboard. The artwork carries its own printed title
 * and caption, so the card doesn't repeat them — it adds only what the picture
 * can't know: your streak and how far the next level is.
 */
export default function CharacterCard({ stats }: { stats: Stats }) {
  const state = characterState(stats)
  const depleted = state.mode === 'depleted'

  return (
    <Card className="overflow-hidden" accent={depleted ? 'var(--color-bad)' : 'var(--color-good)'}>
      <CharacterArt state={state} />

      <div className="p-4">
        {state.mode === 'powered' ? (
          <>
            <div className="mb-1.5 flex items-baseline justify-between text-sm">
              <span className="font-semibold">
                {state.streak}-day streak
                <span className="ml-2 text-xs font-normal text-ink-3">Level {state.level}</span>
              </span>
              {state.next
                ? <span className="text-xs text-ink-3">{state.toNext} to {state.next.name}</span>
                : <span className="text-xs font-semibold text-warn">Max level</span>}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div className="h-2 rounded-full bg-good transition-all" style={{ width: `${state.progress * 100}%` }} />
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <span className="shrink-0 rounded-lg bg-bad/15 px-2.5 py-1 text-sm font-bold text-bad">
              {state.daysMissed}d
            </span>
            <p className="text-sm text-bad">Log every habit for a full day to power back up.</p>
          </div>
        )}
      </div>
    </Card>
  )
}

/** The collectibles shelf. Earned once, kept forever — keyed off your best streak. */
export function MilestoneShelf({ stats }: { stats: Stats }) {
  const { all, next, best, set } = milestoneProgress(stats)
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-semibold">Streak milestones</h2>
        <span className="text-xs text-ink-3">
          {next ? `${next.days - best} days to ${next.name}` : 'All unlocked'}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {all.map((m) => (
          <div
            key={m.days}
            className={`flex flex-col items-center gap-1 rounded-xl border p-1.5 text-center ${
              m.earned ? 'border-warn/40 bg-warn/10' : 'border-border bg-surface-2'
            }`}
            title={`${m.name} — ${m.days}-day streak`}
          >
            <MilestoneIcon set={set.key} days={m.days} earned={m.earned} />
            <div className={`text-[11px] font-semibold leading-tight ${m.earned ? 'text-ink' : 'text-ink-3'}`}>{m.days}d</div>
            <div className={`text-[9px] leading-tight ${m.earned ? 'text-ink-2' : 'text-ink-3'}`}>{m.name}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

/** Small preview of the whole ladder, so you can see what's coming. */
export function LevelLadder({ stats }: { stats: Stats }) {
  const state = characterState(stats)
  const currentLevel = state.mode === 'powered' ? state.level : 0
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-semibold">The ladder</h2>
        <span className="text-xs text-ink-3">{state.set.label}</span>
      </div>
      <ul className="space-y-1">
        {state.set.levels.map((t, i) => {
          const reached = currentLevel >= i + 1
          return (
            <li
              key={t.key}
              className={`flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm ${
                currentLevel === i + 1 ? 'bg-good/10 ring-1 ring-inset ring-good/40' : ''
              }`}
            >
              <span className={`w-4 text-center text-xs font-bold ${reached ? 'text-good' : 'text-ink-3'}`}>{i + 1}</span>
              <span className={`flex-1 truncate ${reached ? '' : 'text-ink-3'}`}>{t.name}</span>
              <span className="shrink-0 text-xs text-ink-3">{t.at === 0 ? 'start' : `${t.at}d`}</span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
