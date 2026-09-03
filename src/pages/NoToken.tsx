import { ErrorNote } from '../components/ui'

export default function NoToken({ error }: { error?: string | null }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="text-5xl">☑</div>
      <h1 className="text-2xl font-bold">70 Days</h1>
      <ErrorNote msg={error} />
      <p className="text-ink-2">Open your personal link to sign in. It looks like <code className="text-ink">/u/…</code> and was sent to you by whoever runs the group.</p>
      <p className="text-xs text-ink-3">Tip: once you are in, add this page to your home screen.</p>
    </div>
  )
}
