import { ErrorNote } from '../components/ui'

/** Shown when there's no usable token — either none at all, or one the server rejected. */
export default function NoToken({ error }: { error?: string | null }) {
  const rejected = !!error
  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="text-5xl">☑</div>
      <h1 className="text-2xl font-bold">70 Days</h1>
      <ErrorNote msg={error} />
      {rejected ? (
        <p className="text-ink-2">
          That link didn’t work. Messaging apps sometimes cut long links in half — try opening it again,
          or ask for a fresh one.
        </p>
      ) : (
        <p className="text-ink-2">
          Open your personal link to sign in. It looks like <code className="text-ink">/u/…</code> and was
          sent to you by whoever runs the group.
        </p>
      )}
      <p className="text-xs text-ink-3">
        Opening it from a chat app? Tap ••• and choose <b className="text-ink-2">Open in browser</b> — in-app
        browsers often can’t keep you signed in.
      </p>
    </div>
  )
}
