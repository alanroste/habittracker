const KEY = 'ht.token'

/**
 * The token is held in memory as well as localStorage. Some browsers refuse to
 * persist anything — private mode, in-app browsers (WhatsApp, Instagram,
 * Messenger), "block all site data" — and previously that silently locked
 * people out: the token was written, the write threw, the app redirected away
 * from the link, and the next read found nothing. Memory keeps the session
 * alive for the visit, and the /u/<token> URL can always re-establish it.
 */
let memoryToken: string | null = null

export function getToken(): string | null {
  if (memoryToken) return memoryToken
  try { memoryToken = localStorage.getItem(KEY) } catch { /* storage blocked */ }
  return memoryToken
}

export function setToken(token: string) {
  memoryToken = token
  try { localStorage.setItem(KEY, token) } catch { /* storage blocked; memory still holds it */ }
}

export function clearToken() {
  memoryToken = null
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}

/** Extract the token from a /u/<token> path. */
export function tokenFromPath(pathname: string = window.location.pathname): string | null {
  const m = pathname.match(/^\/u\/([^/?#]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

/** False when the browser won't persist anything, so the session dies on refresh. */
export function storageAvailable(): boolean {
  try {
    localStorage.setItem('ht.probe', '1')
    localStorage.removeItem('ht.probe')
    return true
  } catch {
    return false
  }
}
