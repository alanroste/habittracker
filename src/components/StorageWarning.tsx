import { storageAvailable } from '../lib/session'
import { Card } from './ui'

/**
 * Some browsers refuse to persist anything — private mode, and the in-app
 * browsers in WhatsApp/Instagram/Messenger. The session still works for this
 * visit (the token is held in memory), but it won't survive a refresh, so say so
 * rather than letting people get mysteriously logged out.
 */
export default function StorageWarning() {
  if (storageAvailable()) return null
  return (
    <Card className="border-warn/40 bg-warn/10 p-3 text-sm">
      <div className="font-medium text-warn">This browser won’t keep you signed in</div>
      <p className="mt-0.5 text-ink-2">
        You’re in private mode or a chat app’s built-in browser. Everything works now, but refreshing will
        sign you out. Tap ••• → <b>Open in browser</b>, then add it to your home screen.
      </p>
    </Card>
  )
}
