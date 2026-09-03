import { addDays, diffDays } from '../lib/dates'
import type { Stats } from '../types'

/** Last 10 days as dots. Green = fully logged, red = missed logs, amber = had a miss, faint = future. */
export default function CalendarStrip({ stats, selected, onSelect }: { stats: Stats; selected: string; onSelect: (d: string) => void }) {
  const { today, user } = stats
  const byDate = new Map(stats.daily_history.map((d) => [d.date, d]))
  const missed = new Set(stats.missed_days.map((m) => m.date))
  const start = user.started_on
  const days: string[] = []
  const WINDOW = 10
  const first = diffDays(today, start) >= WINDOW - 1 ? addDays(today, -(WINDOW - 1)) : start
  for (let d = first; d <= today; d = addDays(d, 1)) days.push(d)
  while (days.length < WINDOW) days.push(addDays(days[days.length - 1] ?? today, 1))

  return (
    <div className="flex justify-between gap-1">
      {days.map((d) => {
        const future = d > today
        const rec = byDate.get(d)
        const isToday = d === today
        let cls = 'bg-surface-2 text-ink-3'
        if (missed.has(d)) cls = 'bg-bad/80 text-white'
        else if (rec && rec.misses > 0) cls = 'bg-warn/80 text-black'
        else if (rec && !future && rec.pending === 0 && rec.unlogged === 0) cls = 'bg-good text-black'
        else if (isToday) cls = 'bg-surface-2 text-ink'
        if (future) cls = 'bg-transparent text-ink-3/40'
        const sel = d === selected ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg' : ''
        return (
          <button
            key={d}
            disabled={future || d < start}
            onClick={() => onSelect(d)}
            title={d}
            className={`flex h-7 w-7 shrink-0 items-center sm:h-8 sm:w-8 justify-center rounded-full text-xs font-medium tabular-nums ${cls} ${sel} disabled:cursor-default`}
          >
            {Number(d.slice(8))}
          </button>
        )
      })}
    </div>
  )
}
