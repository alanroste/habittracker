import { fmt } from '../lib/dates'
import { categoryMeta, type Excuse } from '../types'
import { Card, Empty } from './ui'

/** Every excuse, from everyone, newest first. The wall of shame. */
export default function ImABum({ excuses }: { excuses: Excuse[] }) {
  if (excuses.length === 0) {
    return <Card className="p-6"><Empty>Nobody has missed anything yet. Suspicious.</Empty></Card>
  }
  return (
    <Card className="divide-y divide-border p-1">
      {excuses.map((e, i) => (
        <div key={i} className="flex gap-3 px-3 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">{e.user_name}</span>
              <span className="text-ink-3">missed</span>
              <span style={{ color: categoryMeta(e.category).color }}>{e.habit}</span>
            </div>
            <div className="mt-0.5 italic text-ink-2">“{e.reason}”</div>
          </div>
          <span className="shrink-0 text-xs text-ink-3">{fmt(e.date)}</span>
        </div>
      ))}
    </Card>
  )
}
