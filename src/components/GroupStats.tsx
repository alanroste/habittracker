import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { CATEGORIES, timeMeta, type Category, type GroupHabit, type GroupStats } from '../types'
import { Pct, Spinner } from './ui'
import { TallyBar } from './charts'
import { Section } from './StatsView'
import { frequencyLabel } from './HabitForm'

/** Group tab on Friends: the crew's combined numbers, then who's winning each category. */
export default function GroupStatsView({ data }: { data: GroupStats }) {
  const active = data.users.filter((u) => u.onboarded)
  const [open, setOpen] = useState<Category | null>(null)

  // Only fetched once someone drills into a category.
  const habits = useQuery({ queryKey: ['groupHabits'], queryFn: api.groupHabits, enabled: open !== null })

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
        const isOpen = open === c.key
        return (
          <div key={c.key} className="rounded-2xl border border-border bg-surface" style={{ borderTop: `3px solid ${c.color}` }}>
            <button
              onClick={() => setOpen(isOpen ? null : c.key)}
              className="flex w-full items-baseline justify-between p-4 text-left"
              aria-expanded={isOpen}
            >
              <h2 className="font-semibold">{c.label}</h2>
              <span className="flex items-center gap-2 text-xs text-ink-3">
                {isOpen ? 'hide habits' : 'see habits'}
                <span aria-hidden className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
              </span>
            </button>

            <div className="space-y-1 px-4 pb-4">
              {rows.map((r, i) => (
                <div key={r.user.id} className="flex items-center gap-3 py-1">
                  <span className={`w-5 text-center text-sm font-bold ${i === 0 ? 'text-warn' : 'text-ink-3'}`}>{i === 0 ? '★' : i + 1}</span>
                  <span className="flex-1 truncate text-sm">{r.user.name}</span>
                  <span className="text-xs text-ink-3">{r.t.hits}/{r.t.hits + r.t.misses + r.t.unlogged}</span>
                  <Pct value={r.t.pct} size="sm" />
                </div>
              ))}
            </div>

            {isOpen && (
              <div className="border-t border-border px-4 py-3">
                {habits.isLoading && <div className="grid place-items-center py-4"><Spinner /></div>}
                {habits.data && <HabitList habits={habits.data.filter((h) => h.category === c.key)} />}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const STATUS: Record<GroupHabit['status'], { label: string; cls: string }> = {
  done: { label: 'Done', cls: 'bg-good/15 text-good' },
  missed: { label: 'Missed', cls: 'bg-bad/15 text-bad' },
  open: { label: 'Open', cls: 'bg-warn/15 text-warn' },
  over: { label: 'Over limit', cls: 'bg-bad/15 text-bad' },
  ok: { label: 'Within limit', cls: 'bg-good/15 text-good' },
}

/** Every habit in one category across the crew, grouped by owner. */
function HabitList({ habits }: { habits: GroupHabit[] }) {
  if (habits.length === 0) return <p className="text-sm text-ink-3">No habits in this category.</p>
  const owners = [...new Set(habits.map((h) => h.user_name))].sort()
  return (
    <div className="space-y-3">
      {owners.map((owner) => (
        <div key={owner}>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-2">{owner}</div>
          <ul className="divide-y divide-border rounded-xl border border-border">
            {habits.filter((h) => h.user_name === owner).map((h) => {
              const st = STATUS[h.status]
              const t = timeMeta(h.time_of_day)
              return (
                <li key={h.habit_id} className="flex items-center gap-2 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{h.title}</div>
                    <div className="flex items-center gap-2 text-xs text-ink-3">
                      <span>{frequencyLabel(h)}</span>
                      {h.frequency !== 'daily' && <span>{h.week_count}/{h.target_count} this week</span>}
                      {h.time_of_day !== 'anytime' && (
                        <span style={{ color: t.color }}>{t.icon} {t.label}</span>
                      )}
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${st.cls}`}>{st.label}</span>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
