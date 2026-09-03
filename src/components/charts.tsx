import { addDays, fmt } from '../lib/dates'
import type { Stats, Tally } from '../types'
import { CATEGORIES } from '../types'

/** 70 cells, one per challenge day. Status colors carry meaning; the legend names them. */
export function ChallengeHeatmap({ stats, onSelect }: { stats: Stats; onSelect?: (d: string) => void }) {
  const { user, today } = stats
  const byDate = new Map(stats.daily_history.map((d) => [d.date, d]))
  const cells = Array.from({ length: user.challenge_days }, (_, i) => addDays(user.started_on, i))
  const cellClass = (d: string) => {
    if (d > today) return 'bg-surface-2/50'
    const r = byDate.get(d)
    if (!r) return 'bg-surface-2'
    if (r.unlogged > 0) return 'bg-ink-3/50'
    if (r.misses > 0) return 'bg-bad'
    if (r.pending > 0) return 'bg-surface-2 ring-1 ring-inset ring-accent'
    return 'bg-good'
  }
  return (
    <div>
      <div className="grid grid-cols-10 gap-1">
        {cells.map((d, i) => (
          <button
            key={d}
            onClick={() => d <= today && onSelect?.(d)}
            title={`Day ${i + 1} · ${fmt(d)}`}
            className={`aspect-square rounded-[4px] ${cellClass(d)} ${d === today ? 'outline outline-2 outline-offset-1 outline-ink' : ''}`}
            aria-label={`Day ${i + 1}`}
          />
        ))}
      </div>
      <Legend items={[['bg-good', 'All done'], ['bg-bad', 'Had a miss'], ['bg-ink-3/50', 'Not logged'], ['bg-surface-2/50', 'Upcoming']]} />
    </div>
  )
}

export function Legend({ items }: { items: [string, string][] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-3">
      {items.map(([c, l]) => (
        <span key={l} className="inline-flex items-center gap-1"><i className={`inline-block h-2.5 w-2.5 rounded-[3px] ${c}`} />{l}</span>
      ))}
    </div>
  )
}

/** Horizontal bar: share of hits / misses / unlogged, plus the % as text. */
export function TallyBar({ t, label, color }: { t: Tally; label: string; color?: string }) {
  const total = t.hits + t.misses + t.unlogged
  const w = (n: number) => (total ? `${(100 * n) / total}%` : '0%')
  const pct = t.pct == null ? 100 : t.pct
  return (
    <div className="py-1.5">
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium" style={color ? { color } : undefined}>{label}</span>
        <span className="tabular-nums text-ink-2">
          {Math.round(pct)}% <span className="text-ink-3">· {t.hits}/{total}{t.pending ? ` · ${t.pending} open` : ''}</span>
        </span>
      </div>
      <div className="flex h-2 gap-px overflow-hidden rounded-full bg-surface-2">
        <div className="bg-good" style={{ width: w(t.hits) }} />
        <div className="bg-bad" style={{ width: w(t.misses) }} />
        <div className="bg-ink-3/50" style={{ width: w(t.unlogged) }} />
      </div>
    </div>
  )
}

export function CategoryBars({ stats }: { stats: Stats }) {
  return (
    <div>
      {CATEGORIES.map((c) => {
        const t = stats.categories.find((x) => x.category === c.key)
        if (!t) return null
        return <TallyBar key={c.key} t={t} label={c.label} color={c.color} />
      })}
      <Legend items={[['bg-good', 'Hit'], ['bg-bad', 'Missed'], ['bg-ink-3/50', 'Not logged']]} />
    </div>
  )
}

/** Weekly column chart of daily-habit hits vs misses. Thin marks, one axis, direct labels only on the total. */
export function WeeklyChart({ stats }: { stats: Stats }) {
  const weeks = new Map<string, { hits: number; misses: number; unlogged: number }>()
  for (const d of stats.daily_history) {
    const ws = weekStartOf(d.date)
    const w = weeks.get(ws) ?? { hits: 0, misses: 0, unlogged: 0 }
    w.hits += d.hits; w.misses += d.misses; w.unlogged += d.unlogged
    weeks.set(ws, w)
  }
  const rows = [...weeks.entries()].sort(([a], [b]) => (a < b ? -1 : 1))
  if (!rows.length) return <p className="text-sm text-ink-3">No days scored yet.</p>
  const max = Math.max(1, ...rows.map(([, w]) => w.hits + w.misses + w.unlogged))
  return (
    <div>
      <div className="flex items-end gap-2">
        {rows.map(([ws, w], i) => {
          const total = w.hits + w.misses + w.unlogged
          return (
            <div key={ws} className="flex flex-1 flex-col items-center gap-1" title={`Week of ${fmt(ws)}: ${w.hits} hit, ${w.misses} missed, ${w.unlogged} unlogged`}>
              <span className="text-[10px] tabular-nums text-ink-3">{total ? Math.round((100 * w.hits) / total) : 0}%</span>
              <div className="flex w-full max-w-8 flex-col-reverse gap-px overflow-hidden rounded-t-[4px]" style={{ height: `${Math.round((96 * total) / max)}px` }}>
                <div className="bg-good" style={{ flex: w.hits }} />
                <div className="bg-bad" style={{ flex: w.misses }} />
                <div className="bg-ink-3/50" style={{ flex: w.unlogged }} />
              </div>
              <span className="text-[10px] text-ink-3">W{i + 1}</span>
            </div>
          )
        })}
      </div>
      <Legend items={[['bg-good', 'Hit'], ['bg-bad', 'Missed'], ['bg-ink-3/50', 'Not logged']]} />
    </div>
  )
}

function weekStartOf(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  const dow = (dt.getUTCDay() + 6) % 7
  dt.setUTCDate(dt.getUTCDate() - dow)
  return dt.toISOString().slice(0, 10)
}
