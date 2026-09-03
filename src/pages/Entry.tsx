import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { setToken, clearToken } from '../lib/session'
import { Spinner, ErrorNote, Button } from '../components/ui'

/** /u/:token — the personal login link. Validates, stores the token, then reloads into the app. */
export default function Entry() {
  const { token } = useParams()
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!token) return
    api.me(token)
      .then(() => { setToken(token); window.location.replace('/') })
      .catch((e) => { clearToken(); setError((e as Error).message) })
  }, [token])
  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-4 p-6 text-center">
      {error ? (
        <>
          <ErrorNote msg={error} />
          <p className="text-sm text-ink-2">Ask whoever set this up for a fresh link.</p>
          <Button variant="ghost" onClick={() => window.location.replace('/')}>Back</Button>
        </>
      ) : (
        <><Spinner /><p className="text-sm text-ink-2">Signing you in…</p></>
      )}
    </div>
  )
}
