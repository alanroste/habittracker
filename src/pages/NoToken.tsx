import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listMembers, signInAs } from '../lib/api'
import { setToken } from '../lib/session'
import { artUrl, getSet } from '../lib/character'
import { Card, ErrorNote, Spinner } from '../components/ui'

/**
 * Shown when there's no usable token. Besides explaining the personal link, it
 * offers a name picker — an installed home-screen icon can open without a token
 * (its start_url predates the per-user manifest, or storage was wiped), and
 * without this there is no way back in from inside the app.
 *
 * Trade-off, deliberately accepted for a private group: anyone who reaches the
 * site can sign in as any member. Drop list_members/sign_in_as to require links.
 */
export default function NoToken({ error }: { error?: string | null }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [failed, setFailed] = useState<string | null>(null)
  const members = useQuery({ queryKey: ['members'], queryFn: listMembers, retry: 1 })

  const pick = async (id: string) => {
    setBusy(id)
    setFailed(null)
    try {
      const me = await signInAs(id)
      setToken(me.login_token)
      window.location.replace(`/u/${me.login_token}`)
    } catch (e) {
      setFailed((e as Error).message)
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 p-6">
      <div className="text-center">
        <div className="text-5xl">☑</div>
        <h1 className="mt-2 text-2xl font-bold">70 Days</h1>
      </div>

      <ErrorNote msg={error} />
      <ErrorNote msg={failed} />

      <Card className="p-4">
        <h2 className="font-semibold">Who are you?</h2>
        <p className="mb-3 mt-0.5 text-sm text-ink-3">Tap your name to jump back into your account.</p>

        {members.isLoading && <div className="grid place-items-center py-6"><Spinner /></div>}
        {members.error && <p className="text-sm text-bad">Couldn’t load the group. Check your connection.</p>}

        <div className="grid grid-cols-2 gap-2">
          {members.data?.map((m) => (
            <button
              key={m.id}
              onClick={() => pick(m.id)}
              disabled={!!busy}
              className="flex items-center gap-2 overflow-hidden rounded-xl border border-border bg-surface-2 pr-2 text-left transition hover:border-accent disabled:opacity-50"
            >
              <img
                src={artUrl(getSet(m.character_set).key, 'level-1')}
                alt=""
                loading="lazy"
                className="h-12 w-12 shrink-0 object-cover"
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {busy === m.id ? 'Signing in…' : m.name}
              </span>
            </button>
          ))}
        </div>
      </Card>

      <p className="text-center text-xs text-ink-3">
        {error
          ? 'That link didn’t work — chat apps sometimes cut long links in half.'
          : 'Your personal link also works: it looks like /u/… and was sent to you by whoever runs the group.'}
      </p>
    </div>
  )
}
