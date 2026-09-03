import type { DayHabit } from '../types'
import { frequencyLabel } from './HabitForm'

export interface RowActions {
  onDone: (h: DayHabit) => void        // toggle ✓ for the day (daily/per_week)
  onMiss: (h: DayHabit) => void        // open reason sheet
  onClear: (h: DayHabit) => void
  onCount: (h: DayHabit, count: number) => void // limit_week counter
}

export default function HabitRow({ h, actions, readOnly }: { h: DayHabit; actions?: RowActions; readOnly?: boolean }) {
  const done = h.log?.status === 'done'
  const missed = h.log?.status === 'missed'
  const isLimit = h.frequency === 'limit_week'
  const over = isLimit && h.week_count > h.target_count
  const weekly = h.frequency !== 'daily'

  return (
    <div className="flex items-center gap-2 py-2">
      <div className="min-w-0 flex-1">
        <div className={`truncate text-[15px] ${done && !isLimit ? 'text-ink-2 line-through decoration-good/60' : ''} ${missed ? 'text-ink-2' : ''}`}>
          {h.title}
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-3">
          <span>{frequencyLabel(h)}</span>
          {weekly && (
            <span className={over ? 'font-medium text-bad' : h.week_count >= h.target_count && !isLimit ? 'font-medium text-good' : ''}>
              {h.week_count}/{h.target_count} this week
            </span>
          )}
          {missed && h.log?.reason && <span className="truncate italic text-bad/90">“{h.log.reason}”</span>}
        </div>
      </div>

      {isLimit ? (
        <div className="flex items-center gap-1">
          {!readOnly && (
            <button
              onClick={() => actions?.onCount(h, Math.max(0, (h.log?.count ?? 0) - 1))}
              disabled={!h.log?.count}
              className="h-9 w-9 rounded-full bg-surface-2 text-lg text-ink-2 disabled:opacity-30"
              aria-label="Remove one"
            >−</button>
          )}
          <span className={`w-6 text-center text-lg font-semibold tabular-nums ${over ? 'text-bad' : ''}`}>{h.log?.count ?? 0}</span>
          {!readOnly && (
            <button
              onClick={() => actions?.onCount(h, (h.log?.count ?? 0) + 1)}
              className={`h-9 w-9 rounded-full text-lg font-semibold ${over ? 'bg-bad/20 text-bad' : 'bg-surface-2 text-ink'}`}
              aria-label="Add one"
            >+</button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <button
            disabled={readOnly}
            onClick={() => (done ? actions?.onClear(h) : actions?.onDone(h))}
            className={`h-10 w-10 rounded-full text-lg font-bold transition ${done ? 'bg-good text-black' : 'bg-surface-2 text-ink-3'} disabled:cursor-default`}
            aria-label={done ? 'Done (tap to undo)' : 'Mark done'}
            aria-pressed={done}
          >✓</button>
          {h.frequency === 'daily' && (
            <button
              disabled={readOnly}
              onClick={() => (missed ? actions?.onClear(h) : actions?.onMiss(h))}
              className={`h-10 w-10 rounded-full text-lg font-bold transition ${missed ? 'bg-bad text-white' : 'bg-surface-2 text-ink-3'} disabled:cursor-default`}
              aria-label={missed ? 'Missed (tap to undo)' : 'Mark missed'}
              aria-pressed={missed}
            >✕</button>
          )}
        </div>
      )}
    </div>
  )
}
