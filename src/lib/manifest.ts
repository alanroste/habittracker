import { getToken } from './session'

/**
 * Point the manifest link at this user's own /u/<token> instead of the generic
 * static manifest. Without this, "Add to Home Screen" / "Install app" bakes in
 * start_url "/" for everyone — and on iOS, an installed home-screen app gets
 * its own separate storage from Safari, so the token saved to localStorage
 * while browsing isn't there on the icon's first cold launch. Baking the
 * token into start_url means every launch re-authenticates from the URL
 * itself, which is self-healing regardless of storage quirks.
 */
export function syncManifestToToken() {
  try {
    const match = window.location.pathname.match(/^\/u\/([^/]+)/)
    const token = match ? match[1] : getToken()
    if (!token) return
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
    if (link) link.href = `/app.webmanifest?u=${encodeURIComponent(token)}`
  } catch {
    // best-effort: worst case the install just isn't personalized
  }
}

export function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari's own flag, not in the DOM lib types
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream
}
