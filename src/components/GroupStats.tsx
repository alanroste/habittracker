import { CATEGORIES, type GroupStats } from '../types'
import { Pct } from './ui'
import { TallyBar } from './charts'
import { Section } from './StatsView'

/** Group tab on Friends: the crew's combined numbers, then who's winning each category. */
export default function GroupStatsView({ data }: { data: GroupStats }) {
  const active = data.users.filter((u) => u.onboarded)

  return (
    <div className="space-y-4">
      <Section title="The group, combined" sub={`${active.length} active`}>
        {CATEGORIES.map((c) => {
          const t = data.categories.find((x) => x.category === c.key)
          if (!t) return null
          return <TallyBar key={c.key} t={t} label={c.label} color={c.color} />
        })}
        {data.categories.length === 0 && <p className="text-sm text-ink-3">No habits logged yet.</p>}
      </Section>

      {CATEGORIES.map((c) => {
        const rows = active
          .map((u) => ({ user: u, t: u.categories.find((x) => x.category === c.key) }))
          .filter((r): r is { user: (typeof active)[number]; t: NonNullable<typeof r.t> } => !!r.t && r.t.hits + r.t.misses + r.t.unlogged > 0)
          .sort((a, b) => (b.t.pct ?? 0) - (a.t.pct ?? 0))
        if (rows.length === 0) return null
        return (
          <Section key={c.key} title={c.label} sub="ranked by on-track %">
            <div className="space-y-1">
              {rows.map((r, i) => (
                <div key={r.user.id} className="flex items-center gap-3 py-1">
                  <span className={`w-5 text-center text-sm font-bold ${i === 0 ? 'text-warn' : 'text-ink-3'}`}>{i === 0 ? '★' : i + 1}</span>
                  <span className="flex-1 truncate text-sm">{r.user.name}</span>
                  <span className="text-xs text-ink-3">{r.t.hits}/{r.t.hits + r.t.misses + r.t.unlogged}</span>
                  <Pct value={r.t.pct} size="sm" />
                </div>
              ))}
            </div>
          </Section>
        )
      })}
    </div>
  )
}
