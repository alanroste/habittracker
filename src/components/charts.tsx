import { addDays, fmt, toDate } from '../lib/dates'
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

/**
 * A single ratio against a limit reads as a meter, not a pie. One track, one fill,
 * the number stated in text beside it.
 */
export function Meter({ pct, tone = 'auto', height = 'h-2' }: { pct: number | null | undefined; tone?: 'auto' | 'neutral'; height?: string }) {
  const v = Math.max(0, Math.min(100, pct == null ? 100 : pct))
  const color = tone === 'neutral' ? 'bg-accent' : v >= 90 ? 'bg-good' : v >= 70 ? 'bg-warn' : 'bg-bad'
  return (
    <div className={`w-full overflow-hidden rounded-full bg-surface-2 ${height}`} role="presentation">
      <div className={`${height} rounded-full ${color}`} style={{ width: `${v}%` }} />
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

/**
 * Where the damage is. Successes are near-constant so they carry no signal;
 * slips are rare, so they are what's worth ranking. Worst first, counts not percentages.
 */
export function SlipsByHabit({ stats }: { stats: Stats }) {
  const rows = stats.habits
    .map((h) => ({ title: h.title, category: h.category, missed: h.misses, unlogged: h.unlogged, slips: h.misses + h.unlogged }))
    .filter((r) => r.slips > 0)
    .sort((a, b) => b.slips - a.slips)

  if (rows.length === 0) {
    return <p className="py-2 text-sm text-good">Nothing missed yet. Clean sheet.</p>
  }
  const max = Math.max(...rows.map((r) => r.slips))
  return (
    <div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.title} className="flex items-center gap-3" title={`${r.missed} missed, ${r.unlogged} never logged`}>
            <span className="w-32 shrink-0 truncate text-sm" style={{ color: CATEGORIES.find((c) => c.key === r.category)?.color }}>
              {r.title}
            </span>
            <div className="flex h-3 flex-1 gap-px overflow-hidden rounded-[4px] bg-surface-2">
              <div className="bg-bad" style={{ width: `${(100 * r.missed) / max}%` }} />
              <div className="bg-ink-3/50" style={{ width: `${(100 * r.unlogged) / max}%` }} />
            </div>
            <span className="w-6 shrink-0 text-right text-sm font-semibold tabular-nums">{r.slips}</span>
          </div>
        ))}
      </div>
      <Legend items={[['bg-bad', 'Missed on purpose'], ['bg-ink-3/50', 'Never logged']]} />
    </div>
  )
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Which day of the week you tend to slip. One series, so no legend — the title names it. */
export function WeekdayPattern({ stats }: { stats: Stats }) {
  const buckets = WEEKDAYS.map(() => ({ slips: 0, days: 0 }))
  for (const d of stats.daily_history) {
    const idx = (toDate(d.date).getUTCDay() + 6) % 7 // Monday = 0
    buckets[idx].slips += d.misses + d.unlogged
    buckets[idx].days += 1
  }
  const max = Math.max(1, ...buckets.map((b) => b.slips))
  const worst = buckets.reduce((best, b, i) => (b.slips > buckets[best].slips ? i : best), 0)
  const anySlips = buckets.some((b) => b.slips > 0)

  return (
    <div>
      <div className="flex items-end gap-1.5">
        {buckets.map((b, i) => (
          <div key={WEEKDAYS[i]} className="flex flex-1 flex-col items-center gap-1" title={`${WEEKDAYS[i]}: ${b.slips} slips over ${b.days} ${b.days === 1 ? 'day' : 'days'}`}>
            <span className="text-[10px] tabular-nums text-ink-3">{b.slips || ''}</span>
            <div className="flex h-16 w-full items-end">
              <div
                className={`w-full rounded-t-[4px] ${anySlips && i === worst ? 'bg-bad' : 'bg-ink-3/50'}`}
                style={{ height: `${Math.max(3, (100 * b.slips) / max)}%` }}
              />
            </div>
            <span className={`text-[10px] ${anySlips && i === worst ? 'font-semibold text-bad' : 'text-ink-3'}`}>{WEEKDAYS[i][0]}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-3">
        {anySlips ? `${WEEKDAYS[worst]} is your weak spot.` : 'No slips on any day yet.'}
      </p>
    </div>
  )
}
