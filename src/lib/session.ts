const KEY = 'ht.token'

export function getToken(): string | null {
  try { return localStorage.getItem(KEY) } catch { return null }
}
export function setToken(token: string) {
  try { localStorage.setItem(KEY, token) } catch { /* private mode */ }
}
export function clearToken() {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}
