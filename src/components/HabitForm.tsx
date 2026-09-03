import { useState } from 'react'
import { Button, Field, inputCls } from './ui'
import { TIMES, type Category, type Frequency, type Habit, type TimeOfDay } from '../types'

export type HabitInput = { id?: string; category: Category; title: string; frequency: Frequency; target_count: number; time_of_day: TimeOfDay }

export default function HabitForm({
  category, initial, onSave, onCancel, saving,
}: {
  category: Category
  initial?: Habit
  onSave: (h: HabitInput) => void
  onCancel?: () => void
  saving?: boolean
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [frequency, setFrequency] = useState<Frequency>(initial?.frequency ?? (category === 'avoid' ? 'limit_week' : 'daily'))
  const [target, setTarget] = useState(initial?.target_count ?? (category === 'avoid' ? 1 : 3))
  const [time, setTime] = useState<TimeOfDay>(initial?.time_of_day ?? 'anytime')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave({ id: initial?.id, category, title: title.trim(), frequency, target_count: frequency === 'daily' ? 1 : Math.max(1, target), time_of_day: time })
    if (!initial) { setTitle(''); setTime('anytime') }
  }

  const placeholder = {
    health: 'e.g. Take supplements', mind: 'e.g. Read 20 pages', business: 'e.g. 10 cold emails', avoid: 'e.g. League of Legends games',
  }[category]

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label={initial ? 'Habit' : 'New habit'}>
        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={placeholder} autoFocus={!initial} />
      </Field>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Field label="How often">
          <select className={inputCls} value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
            <option value="daily">Every day</option>
            <option value="per_week">At least N times a week</option>
            <option value="limit_week">At most N times a week</option>
          </select>
        </Field>
        {frequency !== 'daily' && (
          <Field label="N">
            <input className={`${inputCls} w-20 text-center`} type="number" min={1} max={99} inputMode="numeric" value={target} onChange={(e) => setTarget(Number(e.target.value))} />
          </Field>
        )}
      </div>
      <Field label="When do you usually do it?">
        <div className="flex gap-1.5">
          {TIMES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTime(t.key)}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl border px-1 py-2 text-xs transition ${
                time === t.key ? 'border-transparent text-ink' : 'border-border bg-surface-2 text-ink-3'
              }`}
              style={time === t.key ? { background: `color-mix(in srgb, ${t.color} 30%, transparent)`, borderColor: t.color } : undefined}
              aria-pressed={time === t.key}
            >
              <span aria-hidden style={{ color: t.color }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </Field>
      <div className="flex gap-2">
        <Button type="submit" disabled={saving || !title.trim()} full>{initial ? 'Save' : 'Add'}</Button>
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  )
}

export function frequencyLabel(h: { frequency: Frequency; target_count: number }) {
  if (h.frequency === 'daily') return 'daily'
  if (h.frequency === 'per_week') return `${h.target_count}×/week`
  return `max ${h.target_count}/week`
}
