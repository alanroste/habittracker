import { useState } from 'react'
import { Button, Sheet, inputCls } from './ui'
import type { DayHabit } from '../types'

const quick = ["I'm a bum", 'Too tired', 'Forgot', 'No time', 'Sick', 'Travelling']

export default function ReasonSheet({ habit, onClose, onSubmit, saving }: {
  habit: DayHabit | null
  onClose: () => void
  onSubmit: (reason: string) => void
  saving?: boolean
}) {
  const [reason, setReason] = useState('')
  return (
    <Sheet open={!!habit} onClose={onClose} title={`Why did you miss “${habit?.title ?? ''}”?`}>
      <p className="mb-3 text-sm text-ink-2">Be honest. Your friends can see this.</p>
      <div className="mb-3 flex flex-wrap gap-2">
        {quick.map((q) => (
          <button key={q} type="button" onClick={() => setReason(q)}
            className={`rounded-full border px-3 py-1 text-sm ${reason === q ? 'border-accent bg-accent/20' : 'border-border bg-surface-2'}`}>
            {q}
          </button>
        ))}
      </div>
      <textarea className={`${inputCls} min-h-20`} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Type your excuse…" autoFocus />
      <div className="mt-3 flex gap-2">
        <Button variant="danger" full disabled={!reason.trim() || saving} onClick={() => { onSubmit(reason.trim()); setReason('') }}>
          Log the miss
        </Button>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </Sheet>
  )
}
