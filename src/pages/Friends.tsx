import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { Card, ErrorNote, Pct, Spinner } from '../components/ui'

export default function Friends() {
  const q = useQuery({ queryKey: ['friends'], queryFn: api.friends })
  if (q.isLoading) return <div className="grid place-items-center py-10"><Spinner /></div>
  if (q.error) return <ErrorNote msg={(q.error as Error).message} />
  const list = q.data ?? []
  return (
    <div>
      <h1 className="mb-3 text-xl font-bold">Friends</h1>
      <div className="space-y-2">
        {list.map((f, i) => (
          <Link key={f.id} to={f.onboarded ? `/friends/${f.id}` : '#'} className={!f.onboarded ? 'pointer-events-none' : ''}>
            <Card className="flex items-center gap-3 p-4">
              <div className="w-6 text-center text-lg font-bold text-ink-3">{f.onboarded ? i + 1 : '–'}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{f.name}</div>
                <div className="text-xs text-ink-3">
                  {f.onboarded
                    ? `Day ${f.day_number} · ${f.habit_count} habits · ${f.hits} hit, ${f.misses} missed${f.unlogged ? `, ${f.unlogged} unlogged` : ''}`
                    : 'Has not started yet'}
                </div>
              </div>
              {f.onboarded ? <Pct value={f.pct} /> : <span className="text-ink-3">—</span>}
            </Card>
          </Link>
        ))}
        {list.length === 0 && <p className="text-center text-sm text-ink-3">Nobody else here yet.</p>}
      </div>
    </div>
  )
}
