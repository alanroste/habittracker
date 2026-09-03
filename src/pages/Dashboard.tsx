import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useSession } from '../lib/SessionContext'
import { addDays, dayLabel, fmt, todayIn } from '../lib/dates'
import type { DayHabit } from '../types'
import { Card, ErrorNote, Pct, Spinner } from '../components/ui'
import DayGrid from '../components/DayGrid'
import ReasonSheet from '../components/ReasonSheet'
import CalendarStrip from '../components/CalendarStrip'
import InstallBanner from '../components/InstallBanner'
import type { RowActions } from '../components/HabitRow'

export default function Dashboard() {
  const { me } = useSession()
  const qc = useQueryClient()
  const today = todayIn(me!.timezone)
  const [date, setDate] = useState(today)
  const [missing, setMissing] = useState<DayHabit | null>(null)

  const day = useQuery({ queryKey: ['day', date], queryFn: () => api.dayView(date) })
  const stats = useQuery({ queryKey: ['stats', 'me'], queryFn: () => api.stats() })

  const after = () => {
    qc.invalidateQueries({ queryKey: ['day'] })
    qc.invalidateQueries({ queryKey: ['stats'] })
    qc.invalidateQueries({ queryKey: ['friends'] })
  }
  const log = useMutation({
    mutationFn: (v: { h: DayHabit; status: 'done' | 'missed'; reason?: string; count?: number }) =>
      api.logHabit(v.h.id, date, v.status, v.reason, v.count ?? 1),
    onSuccess: after,
  })
  const clear = useMutation({ mutationFn: (h: DayHabit) => api.clearLog(h.id, date), onSuccess: after })

  const actions: RowActions = {
    onDone: (h) => log.mutate({ h, status: 'done' }),
    onMiss: (h) => setMissing(h),
    onClear: (h) => clear.mutate(h),
    onCount: (h, count) => (count === 0 ? clear.mutate(h) : log.mutate({ h, status: 'done', count })),
  }

  const s = stats.data
  const canBack = s ? date > s.user.started_on : false
  const canFwd = date < today
  const err = (log.error ?? clear.error ?? day.error ?? stats.error) as Error | null

  return (
    <div className="space-y-3">
      <InstallBanner />
      {s && (
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-ink-3">Hey {s.user.name}</div>
              <div className="text-lg font-semibold">Day {s.day_number} <span className="text-ink-3">of {s.days_total}</span></div>
            </div>
            <div className="text-center">
              <Pct value={s.overall.pct} />
              <div className="text-xs text-ink-3">on track</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold tabular-nums">{s.days_logged}<span className="text-ink-3">/{s.days_elapsed}</span></div>
              <div className="text-xs text-ink-3">days logged</div>
            </div>
          </div>
          <div className="mt-3">
            <CalendarStrip stats={s} selected={date} onSelect={setDate} />
          </div>
          {s.missed_days.length > 0 && (
            <button onClick={() => setDate(s.missed_days[s.missed_days.length - 1].date)} className="mt-3 w-full rounded-xl bg-bad/10 px-3 py-2 text-left text-sm text-bad">
              {s.missed_days.length} day{s.missed_days.length > 1 ? 's' : ''} not fully logged. Tap to fill in {fmt(s.missed_days[s.missed_days.length - 1].date)}.
            </button>
          )}
          <div className="mt-2 text-center text-xs text-ink-3">{s.days_left} days left · streak {s.streak.current}</div>
        </Card>
      )}

      <div className="flex items-center justify-between px-1">
        <button disabled={!canBack} onClick={() => setDate(addDays(date, -1))} className="rounded-full px-3 py-1 text-ink-2 disabled:opacity-30" aria-label="Previous day">‹</button>
        <div className="text-center">
          <div className="font-semibold">{dayLabel(date, today)}</div>
          {date !== today && <button className="text-xs text-accent" onClick={() => setDate(today)}>Back to today</button>}
        </div>
        <button disabled={!canFwd} onClick={() => setDate(addDays(date, 1))} className="rounded-full px-3 py-1 text-ink-2 disabled:opacity-30" aria-label="Next day">›</button>
      </div>

      <ErrorNote msg={err?.message} />

      {day.isLoading ? (
        <div className="grid place-items-center py-10"><Spinner /></div>
      ) : (
        <DayGrid habits={day.data ?? []} actions={actions} />
      )}

      {day.data?.length === 0 && (
        <p className="text-center text-sm text-ink-3">No habits yet. <Link className="text-accent" to="/settings">Add some in Settings.</Link></p>
      )}

      <ReasonSheet
        habit={missing}
        onClose={() => setMissing(null)}
        saving={log.isPending}
        onSubmit={(reason) => { if (missing) log.mutate({ h: missing, status: 'missed', reason }, { onSuccess: () => setMissing(null) }) }}
      />
    </div>
  )
}
