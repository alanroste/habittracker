import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useSession } from '../lib/SessionContext'
import { timezoneList } from '../lib/dates'
import { CATEGORIES, type Category, type Habit } from '../types'
import { Button, Card, ErrorNote, Field, inputCls } from '../components/ui'
import HabitForm, { frequencyLabel, type HabitInput } from '../components/HabitForm'

export default function Settings() {
  const { me, refresh, logout } = useSession()
  const qc = useQueryClient()
  const [name, setName] = useState(me?.name ?? '')
  const [tz, setTz] = useState(me?.timezone ?? 'UTC')
  const [adding, setAdding] = useState<Category | null>(null)
  const [editing, setEditing] = useState<Habit | null>(null)
  const [copied, setCopied] = useState(false)

  const habits = useQuery({ queryKey: ['habits'], queryFn: api.myHabits })
  const invalidate = () => { qc.invalidateQueries({ queryKey: ['habits'] }); qc.invalidateQueries({ queryKey: ['day'] }); qc.invalidateQueries({ queryKey: ['stats'] }) }
  const save = useMutation({ mutationFn: (h: HabitInput) => api.upsertHabit(h), onSuccess: () => { invalidate(); setEditing(null); setAdding(null) } })
  const del = useMutation({ mutationFn: api.deleteHabit, onSuccess: invalidate })
  const profile = useMutation({ mutationFn: () => api.updateProfile(name, tz), onSuccess: () => { refresh(); qc.invalidateQueries() } })

  const link = `${window.location.origin}/u/${me?.login_token}`
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { window.prompt('Copy your link', link) }
  }
  const err = (save.error ?? del.error ?? profile.error) as Error | null
  const list = habits.data ?? []

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Settings</h1>

      <Card className="space-y-3 p-4">
        <h2 className="font-semibold">Profile</h2>
        <Field label="Name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Timezone">
          <select className={inputCls} value={tz} onChange={(e) => setTz(e.target.value)}>
            {timezoneList().map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Button disabled={profile.isPending || (name === me?.name && tz === me?.timezone)} onClick={() => profile.mutate()}>Save</Button>
        {profile.isSuccess && <span className="ml-3 text-sm text-good">Saved</span>}
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="font-semibold">Habits</h2>
        <ErrorNote msg={err?.message} />
        {CATEGORIES.map((c) => {
          const mine = list.filter((h) => h.category === c.key)
          return (
            <div key={c.key}>
              <div className="mb-1 flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: c.color }}>{c.label}</div>
                {adding !== c.key && <button className="text-xs text-accent" onClick={() => { setAdding(c.key); setEditing(null) }}>+ Add</button>}
              </div>
              <ul className="divide-y divide-border rounded-xl border border-border">
                {mine.map((h) => (
                  <li key={h.id} className="px-3 py-2 text-sm">
                    {editing?.id === h.id ? (
                      <HabitForm category={c.key} initial={h} onSave={(x) => save.mutate(x)} onCancel={() => setEditing(null)} saving={save.isPending} />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="flex-1">{h.title} <span className="text-ink-3">· {frequencyLabel(h)}</span></span>
                        <button className="text-xs text-ink-3 hover:text-ink" onClick={() => { setEditing(h); setAdding(null) }}>Edit</button>
                        <button className="text-xs text-bad" onClick={() => { if (confirm(`Remove “${h.title}”? Its history stays in your stats until today.`)) del.mutate(h.id) }}>Remove</button>
                      </div>
                    )}
                  </li>
                ))}
                {adding === c.key && (
                  <li className="px-3 py-3"><HabitForm category={c.key} onSave={(x) => save.mutate(x)} onCancel={() => setAdding(null)} saving={save.isPending} /></li>
                )}
                {mine.length === 0 && adding !== c.key && <li className="px-3 py-2 text-xs text-ink-3">None</li>}
              </ul>
            </div>
          )
        })}
        <p className="text-xs text-ink-3">New habits count from today. Removed habits stop counting from today.</p>
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="font-semibold">Your login link</h2>
        <p className="text-sm text-ink-2">Anyone with this link can log as you. Keep it to yourself. Use it to sign in on another device.</p>
        <div className="flex gap-2">
          <input readOnly className={`${inputCls} text-xs`} value={link} onFocus={(e) => e.currentTarget.select()} />
          <Button variant="ghost" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
        </div>
        <Button variant="danger" onClick={() => { if (confirm('Sign out on this device?')) logout() }}>Sign out on this device</Button>
      </Card>
    </div>
  )
}
