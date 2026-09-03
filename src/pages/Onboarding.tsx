import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useSession } from '../lib/SessionContext'
import { browserTimezone, timezoneList } from '../lib/dates'
import { CATEGORIES, type Habit } from '../types'
import { Button, Card, ErrorNote, Field, inputCls } from '../components/ui'
import HabitForm, { frequencyLabel, type HabitInput } from '../components/HabitForm'
import CharacterPicker from '../components/CharacterPicker'
import type { CharacterSetKey } from '../lib/character'

export default function Onboarding() {
  const { me, refresh } = useSession()
  const qc = useQueryClient()
  const nav = useNavigate()
  const [step, setStep] = useState(0) // 0 = name, 1..4 = categories, 5 = review
  const [name, setName] = useState(me?.name?.startsWith('Friend ') ? '' : me?.name ?? '')
  const [tz, setTz] = useState(me?.timezone && me.timezone !== 'UTC' ? me.timezone : browserTimezone())
  const [editing, setEditing] = useState<Habit | null>(null)
  const [charSet, setCharSet] = useState<CharacterSetKey>((me?.character_set as CharacterSetKey) ?? 'luffy')

  const habits = useQuery({ queryKey: ['habits'], queryFn: api.myHabits })
  const invalidate = () => qc.invalidateQueries({ queryKey: ['habits'] })
  const save = useMutation({ mutationFn: (h: HabitInput) => api.upsertHabit(h), onSuccess: () => { invalidate(); setEditing(null) } })
  const del = useMutation({ mutationFn: api.deleteHabit, onSuccess: invalidate })
  const profile = useMutation({
    mutationFn: async () => { await api.setCharacter(charSet); return api.updateProfile(name, tz) },
    onSuccess: () => { refresh(); setStep(1) },
  })
  const finish = useMutation({
    mutationFn: api.completeOnboarding,
    onSuccess: async () => { await refresh(); qc.invalidateQueries(); nav('/', { replace: true }) },
  })

  const err = (save.error ?? del.error ?? profile.error ?? finish.error) as Error | null
  const list = habits.data ?? []

  return (
    <div className="mx-auto min-h-dvh max-w-md p-5">
      <div className="mb-4 flex items-center justify-between text-xs text-ink-3">
        <span>Set up your 70 days</span>
        <span>Step {Math.min(step + 1, 6)} of 6</span>
      </div>
      <div className="mb-5 h-1 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-accent transition-all" style={{ width: `${((step + 1) / 6) * 100}%` }} /></div>

      {step === 0 && (
        <Card className="space-y-4 p-5">
          <h1 className="text-2xl font-bold">Who are you?</h1>
          <Field label="Your name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" autoFocus /></Field>
          <Field label="Timezone" hint="Days roll over at midnight in this timezone.">
            <select className={inputCls} value={tz} onChange={(e) => setTz(e.target.value)}>
              {timezoneList().map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <div>
            <span className="mb-1 block text-sm text-ink-2">Pick your character</span>
            <CharacterPicker value={charSet} onChange={setCharSet} />
            <span className="mt-1 block text-xs text-ink-3">They level up with your streak. Changeable later.</span>
          </div>
          <ErrorNote msg={err?.message} />
          <Button full disabled={!name.trim() || profile.isPending} onClick={() => profile.mutate()}>Next</Button>
        </Card>
      )}

      {step >= 1 && step <= 4 && (() => {
        const c = CATEGORIES[step - 1]
        const mine = list.filter((h) => h.category === c.key)
        return (
          <Card accent={c.color} className="space-y-4 p-5">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: c.color }}>{c.label}</h1>
              <p className="text-sm text-ink-2">{c.blurb}</p>
            </div>
            {mine.length > 0 && (
              <ul className="divide-y divide-border rounded-xl border border-border">
                {mine.map((h) => (
                  <li key={h.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                    {editing?.id === h.id ? (
                      <div className="flex-1"><HabitForm category={c.key} initial={h} onSave={(x) => save.mutate(x)} onCancel={() => setEditing(null)} saving={save.isPending} /></div>
                    ) : (
                      <>
                        <span className="flex-1">{h.title} <span className="text-ink-3">· {frequencyLabel(h)}</span></span>
                        <button className="text-xs text-ink-3 hover:text-ink" onClick={() => setEditing(h)}>Edit</button>
                        <button className="text-xs text-bad" onClick={() => del.mutate(h.id)}>Remove</button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {!editing && <HabitForm key={c.key} category={c.key} onSave={(x) => save.mutate(x)} saving={save.isPending} />}
            <ErrorNote msg={err?.message} />
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>
              <Button full onClick={() => setStep(step + 1)}>{mine.length ? 'Next' : c.key === 'health' ? 'Next' : 'Skip'}</Button>
            </div>
          </Card>
        )
      })()}

      {step === 5 && (
        <Card className="space-y-4 p-5">
          <h1 className="text-2xl font-bold">Ready, {name || me?.name}?</h1>
          <p className="text-sm text-ink-2">Day 1 starts today. You have {list.length} habit{list.length === 1 ? '' : 's'}. You can edit them later in Settings.</p>
          {CATEGORIES.map((c) => {
            const mine = list.filter((h) => h.category === c.key)
            if (!mine.length) return null
            return (
              <div key={c.key}>
                <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: c.color }}>{c.label}</div>
                <ul className="text-sm">{mine.map((h) => <li key={h.id}>{h.title} <span className="text-ink-3">· {frequencyLabel(h)}</span></li>)}</ul>
              </div>
            )
          })}
          <ErrorNote msg={err?.message} />
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep(4)}>Back</Button>
            <Button full disabled={list.length === 0 || finish.isPending} onClick={() => finish.mutate()}>Start my 70 days</Button>
          </div>
        </Card>
      )}
    </div>
  )
}
