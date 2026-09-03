import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Spinner() {
  return <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" aria-label="Loading" />
}

export function Card({ children, className = '', accent }: { children: ReactNode; className?: string; accent?: string }) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface ${className}`}
      style={accent ? { borderTop: `3px solid ${accent}` } : undefined}
    >
      {children}
    </div>
  )
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger'; full?: boolean }
export function Button({ variant = 'primary', full, className = '', ...rest }: BtnProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-medium transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100'
  const v = {
    primary: 'bg-accent text-white hover:brightness-110',
    ghost: 'bg-surface-2 text-ink hover:bg-border',
    danger: 'bg-bad/15 text-bad hover:bg-bad/25',
  }[variant]
  return <button className={`${base} ${v} ${full ? 'w-full' : ''} ${className}`} {...rest} />
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-3">{hint}</span>}
    </label>
  )
}

export const inputCls = 'w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-ink outline-none focus:border-accent'

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose}>
      <div
        className="safe-b w-full max-w-md rounded-t-3xl border border-border bg-surface p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={title}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-full px-2 text-ink-3 hover:text-ink" aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ErrorNote({ msg }: { msg: string | null | undefined }) {
  if (!msg) return null
  return <p className="rounded-xl border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{msg}</p>
}

export function Pct({ value, size = 'md' }: { value: number | null | undefined; size?: 'sm' | 'md' | 'lg' }) {
  const v = value == null ? 100 : value
  const color = v >= 90 ? 'text-good' : v >= 70 ? 'text-warn' : 'text-bad'
  const cls = { sm: 'text-base', md: 'text-2xl', lg: 'text-5xl' }[size]
  return <span className={`font-bold tabular-nums ${color} ${cls}`}>{Math.round(v)}%</span>
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-ink-3">{children}</p>
}
