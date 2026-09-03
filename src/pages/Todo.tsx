import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useSession } from '../lib/SessionContext'
import { todayIn } from '../lib/dates'
import { TIMES, type DayHabit, type TimeOfDay } from '../types'
import { Button, Card, ErrorNote, Sheet, Spinner } from '../components/ui'
import HabitRow, { type RowActions } from '../components/HabitRow'
import { ClockIcon } from '../components/icons'
import ReasonSheet from '../components/ReasonSheet'
import InstallBanner from '../components/InstallBanner'

/** Today's habits as a running order: Morning → Afternoon → Evening → Anytime. */
export default function Todo() {
  const { me } = useSession()
  const qc = useQueryClient()
  const today = todayIn(me!.timezone)
  const [missing, setMissing] = useState<DayHabit | null>(null)
  const [moving, setMoving] = useState<DayHabit | null>(null)

  const day = useQuery({ queryKey: ['day', today], queryFn: () => api.dayView(today) })

  const after = () => {
    qc.invalidateQueries({ queryKey: ['day'] })
    qc.invalidateQueries({ queryKey: ['stats'] })
    qc.invalidateQueries({ queryKey: ['habits'] })
    qc.invalidateQueries({ queryKey: ['friends'] })
    qc.invalidateQueries({ queryKey: ['groupHabits'] })
  }
  const log = useMutation({
    mutationFn: (v: { h: DayHabit; status: 'done' | 'missed'; reason?: string; count?: number }) =>
      api.logHabit(v.h.id, today, v.status, v.reason, v.count ?? 1),
    onSuccess: after,
  })
  const clear = useMutation({ mutationFn: (h: DayHabit) => api.clearLog(h.id, today), onSuccess: after })
  const setTime = useMutation({
    mutationFn: (v: { id: string; time: TimeOfDay }) => api.setHabitTime(v.id, v.time),
    onSuccess: () => { after(); setMoving(null) },
  })

  const actions: RowActions = {
    onDone: (h) => log.mutate({ h, status: 'done' }),
    onMiss: (h) => setMissing(h),
    onClear: (h) => clear.mutate(h),
    onCount: (h, count) => (count === 0 ? clear.mutate(h) : log.mutate({ h, status: 'done', count })),
  }

  const habits = day.data ?? []
  const err = (log.error ?? clear.error ?? setTime.error ?? day.error) as Error | null
  const unslotted = habits.filter((h) => h.time_of_day === 'anytime').length

  if (day.isLoading) return <div className="grid place-items-center py-10"><Spinner /></div>

  return (
    <div className="space-y-3">
      <InstallBanner />
      <div>
        <h1 className="text-xl font-bold">To-do today</h1>
        <p className="text-sm text-ink-3">Your habits in the order you plan to do them.</p>
      </div>

      <ErrorNote msg={err?.message} />

      {habits.length === 0 && (
        <p className="text-center text-sm text-ink-3">No habits yet. <Link className="text-accent" to="/settings">Add some in Settings.</Link></p>
      )}

      {habits.length > 0 && unslotted === habits.length && (
        <Card className="p-3 text-sm text-ink-2">
          Nothing is scheduled yet. Tap the clock on any habit to slot it into morning, afternoon, or evening.
        </Card>
      )}

      {TIMES.map((t) => {
        const list = habits.filter((h) => h.time_of_day === t.key)
        if (list.length === 0) return null
        const done = list.filter((h) => h.log?.status === 'done').length
        return (
          <Card key={t.key} accent={t.color} className="px-3 pb-1 pt-2">
            <div className="flex items-baseline justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide" style={{ color: t.color }}>
                <span aria-hidden>{t.icon}</span>
                {t.label}
              </h2>
              <span className="text-xs text-ink-3">{done}/{list.length} done</span>
            </div>
            <div className="divide-y divide-border">
              {list.map((h) => (
                <div key={h.id} className="flex items-center gap-1">
                  <div className="min-w-0 flex-1">
                    <HabitRow h={h} actions={actions} showCategory />
                  </div>
                  <button
                    onClick={() => setMoving(h)}
                    className="shrink-0 rounded-lg px-2 py-1 text-xs text-ink-3 hover:text-ink"
                    aria-label={`Change when ${h.title} is done`}
                    title="Change time of day"
                  >
                    <ClockIcon />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )
      })}

      <Sheet open={!!moving} onClose={() => setMoving(null)} title={`When do you do “${moving?.title ?? ''}”?`}>
        <div className="grid grid-cols-2 gap-2">
          {TIMES.map((t) => (
            <Button
              key={t.key}
              variant="ghost"
              onClick={() => moving && setTime.mutate({ id: moving.id, time: t.key })}
              disabled={setTime.isPending}
              className={moving?.time_of_day === t.key ? 'ring-1 ring-accent' : ''}
            >
              <span aria-hidden style={{ color: t.color }}>{t.icon}</span> {t.label}
            </Button>
          ))}
        </div>
      </Sheet>

      <ReasonSheet
        habit={missing}
        onClose={() => setMissing(null)}
        saving={log.isPending}
        onSubmit={(reason) => { if (missing) log.mutate({ h: missing, status: 'missed', reason }, { onSuccess: () => setMissing(null) }) }}
      />
    </div>
  )
}
