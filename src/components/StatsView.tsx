import { Card, Pct } from './ui'
import { CategoryBars, ChallengeHeatmap, TallyBar, WeeklyChart } from './charts'
import { frequencyLabel } from './HabitForm'
import { fmt } from '../lib/dates'
import { CATEGORIES, categoryMeta, type Stats } from '../types'

/** Everything analytics. Used for your own stats page and for a friend's. */
export default function StatsView({ stats, onSelectDay }: { stats: Stats; onSelectDay?: (d: string) => void }) {
  const s = stats
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="On track"><Pct value={s.overall.pct} size="md" /></Stat>
          <Stat label="Streak"><span className="text-2xl font-bold tabular-nums">{s.streak.current}<span className="text-sm text-ink-3">d</span></span></Stat>
          <Stat label="Best streak"><span className="text-2xl font-bold tabular-nums">{s.streak.best}<span className="text-sm text-ink-3">d</span></span></Stat>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-ink-3">
          <span><b className="text-ink">{s.overall.hits}</b> hits</span>
          <span><b className="text-ink">{s.overall.misses}</b> misses</span>
          <span><b className="text-ink">{s.overall.unlogged}</b> unlogged</span>
        </div>
      </Card>

      <Section title={`${s.days_total}-day map`} sub={`Day ${s.day_number} · ${s.days_left} left · ends ${fmt(s.end_date, { month: 'short', day: 'numeric' })}`}>
        <ChallengeHeatmap stats={s} onSelect={onSelectDay} />
      </Section>

      <Section title="By category">
        <CategoryBars stats={s} />
      </Section>

      <Section title="Week by week" sub="Daily habits only">
        <WeeklyChart stats={s} />
      </Section>

      <Section title="Each habit">
        {CATEGORIES.map((c) => {
          const list = s.habits.filter((h) => h.category === c.key)
          if (!list.length) return null
          return (
            <div key={c.key} className="mb-2">
              <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: c.color }}>{c.label}</div>
              {list.map((h) => (
                <TallyBar key={h.id} t={h} label={`${h.title} · ${frequencyLabel(h)}`} />
              ))}
            </div>
          )
        })}
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

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div>{children}</div>
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
