import { characterState, milestoneProgress, LEVELS } from '../lib/character'
import type { Stats } from '../types'
import { Card } from './ui'
import CharacterArt from './CharacterArt'
import MilestoneIcon from './MilestoneIcon'

/** The hero of the account dashboard: who you currently are, and why. */
export default function CharacterCard({ stats }: { stats: Stats }) {
  const state = characterState(stats)
  const depleted = state.mode === 'depleted'

  return (
    <Card
      className="overflow-hidden p-4"
      accent={depleted ? 'var(--color-bad)' : 'var(--color-good)'}
    >
      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <CharacterArt state={state} size={132} />
        </div>
        <div className="min-w-0 flex-1">
          <div className={`text-xs font-semibold uppercase tracking-wide ${depleted ? 'text-bad' : 'text-good'}`}>
            {depleted ? `${state.daysMissed} day${state.daysMissed === 1 ? '' : 's'} missed` : `Level ${state.level}`}
          </div>
          <h2 className="text-lg font-bold leading-tight">{state.tier.name}</h2>
          <p className="text-sm text-ink-2">{state.tier.caption}</p>

          {state.mode === 'powered' ? (
            <div className="mt-3">
              <div className="mb-1 flex items-baseline justify-between text-xs text-ink-3">
                <span>{state.streak}-day streak</span>
                {state.next ? <span>{state.toNext} to {state.next.name}</span> : <span className="text-warn">Max level</span>}
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                <div className="h-2 rounded-full bg-good" style={{ width: `${state.progress * 100}%` }} />
              </div>
            </div>
          ) : (
            <p className="mt-3 rounded-xl bg-bad/10 px-3 py-2 text-xs text-bad">
              Log every habit for a full day to power back up.
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}

/** The collectibles shelf. Earned once, kept forever — keyed off your best streak. */
export function MilestoneShelf({ stats }: { stats: Stats }) {
  const { all, next, best } = milestoneProgress(stats)
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
            className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-center ${
              m.earned ? 'border-warn/40 bg-warn/10' : 'border-border bg-surface-2'
            }`}
            title={`${m.name} ${m.sub} — ${m.days}-day streak`}
          >
            <MilestoneIcon days={m.days} earned={m.earned} />
            <div className={`text-[10px] font-semibold leading-tight ${m.earned ? 'text-ink' : 'text-ink-3'}`}>{m.days}d</div>
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
      <h2 className="mb-3 font-semibold">The ladder</h2>
      <ul className="space-y-1">
        {LEVELS.map((t, i) => {
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
