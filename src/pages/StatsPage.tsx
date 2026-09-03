import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { ErrorNote, Spinner } from '../components/ui'
import StatsView from '../components/StatsView'

export default function StatsPage() {
  const q = useQuery({ queryKey: ['stats', 'me'], queryFn: () => api.stats() })
  if (q.isLoading) return <div className="grid place-items-center py-10"><Spinner /></div>
  if (q.error || !q.data) return <ErrorNote msg={(q.error as Error)?.message ?? 'Could not load stats'} />
  return (
    <div>
      <h1 className="mb-3 text-xl font-bold">Your stats</h1>
      <StatsView stats={q.data} />
    </div>
  )
}
