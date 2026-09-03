import { CATEGORIES, type DayHabit } from '../types'
import { Card, Empty } from './ui'
import HabitRow, { type RowActions } from './HabitRow'

/** The 2×2 category grid: Health top-left, Mind top-right, Business bottom-left, Do Not bottom-right. */
export default function DayGrid({ habits, actions, readOnly }: { habits: DayHabit[]; actions?: RowActions; readOnly?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {CATEGORIES.map((c) => {
        const list = habits.filter((h) => h.category === c.key)
        const scored = list.filter((h) => h.frequency === 'daily')
        const doneCount = scored.filter((h) => h.log?.status === 'done').length
        return (
          <Card key={c.key} accent={c.color} className="px-3 pb-1 pt-2">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: c.color }}>{c.label}</h3>
              {scored.length > 0 && <span className="text-xs text-ink-3">{doneCount}/{scored.length} today</span>}
            </div>
            {list.length === 0 ? (
              <Empty>Nothing here</Empty>
            ) : (
              <div className="divide-y divide-border">
                {list.map((h) => <HabitRow key={h.id} h={h} actions={actions} readOnly={readOnly} />)}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
