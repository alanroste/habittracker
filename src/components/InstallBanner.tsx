import { useEffect, useState } from 'react'
import { isIOS, isStandalone } from '../lib/manifest'
import { Button, Card } from './ui'
import { DownloadIcon, ShareIcon } from './icons'

const DISMISS_KEY = 'ht.installDismissed'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Nudge to install as an app, with real instructions — there previously
 * weren't any. Shown once per device until dismissed or already installed.
 */
export default function InstallBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1' } catch { return false }
  })
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (dismissed || isStandalone()) return null

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* private mode */ }
    setDismissed(true)
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    dismiss()
  }

  return (
    <Card className="flex items-start gap-3 p-3">
      <div className="mt-0.5 rounded-full bg-accent/15 p-2 text-accent"><DownloadIcon /></div>
      <div className="min-w-0 flex-1 text-sm">
        <div className="font-medium">Put this on your home screen</div>
        {isIOS() ? (
          <p className="mt-0.5 text-ink-3">
            Tap <ShareIcon className="mb-0.5 inline align-middle" /> Share, then <b className="text-ink-2">Add to Home Screen</b>.
          </p>
        ) : deferred ? (
          <p className="mt-0.5 text-ink-3">One tap and you're set — it opens straight to your dashboard.</p>
        ) : (
          <p className="mt-0.5 text-ink-3">
            Tap your browser's menu, then <b className="text-ink-2">Install app</b> (or <b className="text-ink-2">Add to Home Screen</b>).
          </p>
        )}
        {deferred && !isIOS() && (
          <Button onClick={install} className="mt-2 px-3 py-1.5 text-sm">Install</Button>
        )}
      </div>
      <button onClick={dismiss} className="shrink-0 rounded-full px-1 text-ink-3 hover:text-ink" aria-label="Dismiss">✕</button>
    </Card>
  )
}
