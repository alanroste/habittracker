import { Card, Pct } from './ui'
import { CategoryBars, ChallengeHeatmap, Meter, SlipsByHabit, WeekdayPattern } from './charts'
import { frequencyLabel } from './HabitForm'
import { fmt } from '../lib/dates'
import { categoryMeta, type Stats } from '../types'

/**
 * Analytics for one person. Built around what varies: a 70-day challenge is meant to
 * sit near 100%, so the successes are near-constant and carry no signal — the slips do.
 * Hence a single headline meter, then everything else ranked by where it went wrong.
 */
export default function StatsView({ stats, onSelectDay }: { stats: Stats; onSelectDay?: (d: string) => void }) {
  const s = stats
  const slips = s.overall.misses + s.overall.unlogged

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-end justify-between">
          <div>
            <Pct value={s.overall.pct} size="lg" />
            <div className="text-xs text-ink-3">on track</div>
          </div>
          <div className="text-right text-sm">
            <div className="font-semibold">Day {s.day_number} <span className="text-ink-3">of {s.days_total}</span></div>
            <div className="text-xs text-ink-3">{s.days_left} days left</div>
          </div>
        </div>
        <div className="mt-3"><Meter pct={s.overall.pct} height="h-2.5" /></div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          <Stat label="hits" value={s.overall.hits} />
          <Stat label="slips" value={slips} tone={slips > 0 ? 'bad' : undefined} />
          <Stat label="streak" value={`${s.streak.current}d`} />
          <Stat label="best" value={`${s.streak.best}d`} />
        </div>
      </Card>

      <Section title="Where you're slipping" sub={slips ? `${slips} total` : undefined}>
        <SlipsByHabit stats={s} />
      </Section>

      <Section title="Your weak day">
        <WeekdayPattern stats={s} />
      </Section>

      <Section title={`${s.days_total}-day map`} sub={`${s.days_logged}/${s.days_elapsed} logged · ends ${fmt(s.end_date, { month: 'short', day: 'numeric' })}`}>
        <ChallengeHeatmap stats={s} onSelect={onSelectDay} />
      </Section>

      <Section title="By category">
        <CategoryBars stats={s} />
      </Section>

      <Section title="Each habit">
        <div className="space-y-2">
          {s.habits.map((h) => {
            const hSlips = h.misses + h.unlogged
            const total = h.hits + hSlips
            return (
              <div key={h.id} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{h.title}</div>
                  <div className="text-xs text-ink-3">{frequencyLabel(h)} · {categoryMeta(h.category).label}</div>
                </div>
                <div className="w-20 shrink-0"><Meter pct={h.pct} /></div>
                <span className="w-14 shrink-0 text-right text-xs tabular-nums text-ink-2">{h.hits}/{total}</span>
              </div>
            )
          })}
          {s.habits.length === 0 && <p className="text-sm text-ink-3">No habits yet.</p>}
        </div>
      </Section>

      <Section title="Excuses" sub={s.reasons.length ? `${s.reasons.length} logged` : undefined}>
        {s.reasons.length === 0 ? (
          <p className="text-sm text-ink-3">No misses logged. Clean sheet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {s.reasons.map((r, i) => (
              <li key={i} className="py-2 text-sm">
                <div className="flex justify-between text-xs text-ink-3">
                  <span style={{ color: categoryMeta(r.category).color }}>{r.habit}</span>
                  <span>{fmt(r.date)}</span>
                </div>
                <div className="italic">“{r.reason}”</div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: 'bad' }) {
  return (
    <div>
      <div className={`text-xl font-bold tabular-nums ${tone === 'bad' ? 'text-bad' : ''}`}>{value}</div>
      <div className="text-xs text-ink-3">{label}</div>
    </div>
  )
}

export function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-semibold">{title}</h2>
        {sub && <span className="text-xs text-ink-3">{sub}</span>}
      </div>
      {children}
    </Card>
  )
}
