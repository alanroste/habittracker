// Renders the character card across several states so both ladders can be eyeballed.
import { chromium } from 'playwright'
const [base = 'http://localhost:4173', out = 'shots'] = process.argv.slice(2)
const TOKEN = 'f7f8c85f22984b998e9ca4f73b3ea4ae'
const ME = { id: 'u4', name: 'Alan', timezone: 'America/New_York', started_on: '2026-06-25', challenge_days: 70, onboarded: true, today: '2026-09-02', login_token: TOKEN, character_set: 'luffy' }

// history of N clean days ending today (today still pending => streak alive)
const cleanHistory = (n) => {
  const out = []
  const d = new Date(Date.UTC(2026, 8, 2))
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d); x.setUTCDate(d.getUTCDate() - i)
    out.push({ date: x.toISOString().slice(0, 10), hits: 4, misses: 0, unlogged: 0, pending: 0 })
  }
  return out
}
// clean days, then `missed` bad days at the end
const missedHistory = (clean, missed) => {
  const out = cleanHistory(clean + missed)
  for (let i = out.length - missed; i < out.length; i++) { out[i].hits = 2; out[i].misses = 2 }
  return out
}

const statsFor = (history, streak, best) => ({
  user: ME, today: ME.today, day_number: 70, days_total: 70, days_left: 0, end_date: '2026-09-02',
  days_logged: history.length, days_elapsed: history.length, missed_days: [],
  overall: { hits: 100, misses: 2, unlogged: 0, pending: 0, pct: 98 },
  categories: [], habits: [], daily_history: history, weekly_history: [],
  streak: { current: streak, best }, reasons: [],
})

const CASES = [
  { name: 'powered-l1', stats: statsFor(cleanHistory(1), 1, 1) },
  { name: 'powered-l3', stats: statsFor(cleanHistory(9), 9, 9) },
  { name: 'powered-l5', stats: statsFor(cleanHistory(40), 40, 40) },
  { name: 'depleted-d4', stats: statsFor(missedHistory(20, 4), 0, 20) },
  { name: 'depleted-void', stats: statsFor(missedHistory(20, 12), 0, 70) },
]

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const c of CASES) {
  const ctx = await b.newContext({ viewport: { width: 420, height: 700 }, deviceScaleFactor: 2 })
  await ctx.route('**/rest/v1/rpc/**', (route) => {
    const fn = route.request().url().split('/rpc/')[1]
    const json = (d) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(d) })
    if (fn === 'me') return json(ME)
    if (fn === 'stats') return json(c.stats)
    return json([])
  })
  const page = await ctx.newPage()
  await page.goto(base + '/u/' + TOKEN)
  await page.waitForURL(base + '/')
  await page.goto(base + '/me')
  await page.waitForTimeout(600)
  const card = page.locator('.rounded-2xl').first()
  await card.screenshot({ path: `${out}/char-${c.name}.png` })
  console.log('rendered', c.name)
  await ctx.close()
}
await b.close()
