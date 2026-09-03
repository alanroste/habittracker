/** All dates in the app are 'YYYY-MM-DD' strings in the user's timezone. */

export function todayIn(tz: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}
export function toDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
export function fromDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}
export function addDays(s: string, n: number): string {
  const d = toDate(s)
  d.setUTCDate(d.getUTCDate() + n)
  return fromDate(d)
}
export function diffDays(a: string, b: string): number {
  return Math.round((toDate(a).getTime() - toDate(b).getTime()) / 86400000)
}
export function weekStart(s: string): string {
  const d = toDate(s)
  const dow = (d.getUTCDay() + 6) % 7 // Monday = 0
  return addDays(s, -dow)
}
export function fmt(s: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }): string {
  return new Intl.DateTimeFormat('en-US', { ...opts, timeZone: 'UTC' }).format(toDate(s))
}
export function dayLabel(s: string, today: string): string {
  const diff = diffDays(s, today)
  if (diff === 0) return 'Today'
  if (diff === -1) return 'Yesterday'
  return fmt(s)
}
export function browserTimezone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { return 'UTC' }
}
export function timezoneList(): string[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const list = (Intl as any).supportedValuesOf?.('timeZone') as string[] | undefined
    if (list?.length) return list
  } catch { /* fall through */ }
  return ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Australia/Sydney']
}
