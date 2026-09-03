import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { addDays, dayLabel } from '../lib/dates'
import { ErrorNote, Spinner } from '../components/ui'
import DayGrid from '../components/DayGrid'
import StatsView from '../components/StatsView'

export default function FriendDetail() {
  const { id } = useParams()
  const stats = useQuery({ queryKey: ['stats', id], queryFn: () => api.stats(id), enabled: !!id })
  const [date, setDate] = useState<string | null>(null)
  const today = stats.data?.today
  const d = date ?? today
  const day = useQuery({ queryKey: ['day', id, d], queryFn: () => api.dayView(d!, id), enabled: !!d && !!id })

  if (stats.isLoading) return <div className="grid place-items-center py-10"><Spinner /></div>
  if (stats.error || !stats.data) return <ErrorNote msg={(stats.error as Error)?.message ?? 'Not found'} />
  const s = stats.data
  const canBack = !!d && d > s.user.started_on
  const canFwd = !!d && !!today && d < today

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link to="/friends" className="text-ink-3">‹ Friends</Link>
      </div>
      <h1 className="text-xl font-bold">{s.user.name}</h1>

      <div className="flex items-center justify-between px-1">
        <button disabled={!canBack} onClick={() => d && setDate(addDays(d, -1))} className="rounded-full px-3 py-1 text-ink-2 disabled:opacity-30" aria-label="Previous day">‹</button>
        <div className="font-semibold">{d && today ? dayLabel(d, today) : ''}</div>
        <button disabled={!canFwd} onClick={() => d && setDate(addDays(d, 1))} className="rounded-full px-3 py-1 text-ink-2 disabled:opacity-30" aria-label="Next day">›</button>
      </div>
      {day.isLoading ? <div className="grid place-items-center py-6"><Spinner /></div> : <DayGrid habits={day.data ?? []} readOnly />}

      <StatsView stats={s} onSelectDay={setDate} />
    </div>
  )
}
