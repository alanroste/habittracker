// Proves the login link works even when the browser refuses to persist anything
// (private mode / in-app browsers) — the failure mode that locked a user out.
import { chromium } from 'playwright'
const [base = 'http://localhost:4173'] = process.argv.slice(2)
const TOKEN = 'f7f8c85f22984b998e9ca4f73b3ea4ae'
const ME = { id: 'u4', name: 'Alan', timezone: 'America/New_York', started_on: '2026-08-27', challenge_days: 70, onboarded: true, character_set: 'luffy', today: '2026-09-02', login_token: TOKEN }
const errors = []
const expect = (c, m) => { if (!c) errors.push('ASSERT: ' + m) }

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

async function run(label, { blockStorage }, fn) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
  await ctx.route('**/rest/v1/rpc/**', (route) => {
    const fn2 = route.request().url().split('/rpc/')[1]
    const body = route.request().postDataJSON?.() ?? {}
    const json = (d) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(d) })
    if (fn2 === 'me') {
      return body.p_token === TOKEN
        ? json(ME)
        : route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: 'invalid token' }) })
    }
    if (fn2 === 'stats') return json({ user: ME, today: ME.today, day_number: 7, days_total: 70, days_left: 63, end_date: '2026-11-04', days_logged: 5, days_elapsed: 7, missed_days: [], overall: { hits: 5, misses: 0, unlogged: 0, pending: 0, pct: 100 }, categories: [], habits: [], daily_history: [], weekly_history: [], streak: { current: 4, best: 4 }, reasons: [] })
    return json([])
  })
  if (blockStorage) {
    // Mimic Safari private mode / in-app browsers: every localStorage write throws.
    await ctx.addInitScript(() => {
      const boom = () => { throw new DOMException('QuotaExceededError') }
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        value: { getItem: () => null, setItem: boom, removeItem: boom, clear: boom, key: () => null, length: 0 },
      })
    })
  }
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errors.push(`${label}: pageerror ${e}`))
  await fn(page)
  await ctx.close()
  console.log('ran:', label)
}

// 1. Normal browser: link signs you in.
await run('normal', {}, async (page) => {
  await page.goto(`${base}/u/${TOKEN}`)
  await page.waitForTimeout(700)
  expect(await page.getByRole('heading', { name: 'To-do today' }).isVisible(), 'normal: lands on the app')
  expect(!(await page.getByText('Open your personal link').isVisible().catch(() => false)), 'normal: no NoToken screen')
})

// 2. Storage blocked: this is the case that used to fail outright.
await run('storage blocked', { blockStorage: true }, async (page) => {
  await page.goto(`${base}/u/${TOKEN}`)
  await page.waitForTimeout(700)
  expect(await page.getByRole('heading', { name: 'To-do today' }).isVisible(), 'blocked: still signs in from the URL')
  expect(page.url().includes(`/u/${TOKEN}`), 'blocked: keeps the token in the URL so a refresh re-auths')
  expect(await page.getByText('won’t keep you signed in').isVisible(), 'blocked: warns that a refresh will sign out')
  // and a refresh still works, because the URL carries the token
  await page.reload()
  await page.waitForTimeout(700)
  expect(await page.getByRole('heading', { name: 'To-do today' }).isVisible(), 'blocked: survives a refresh at the link')
})

// 3. A mangled link (chat apps truncate) explains itself.
await run('bad token', {}, async (page) => {
  await page.goto(`${base}/u/f7f8c85f2298`)
  await page.waitForTimeout(700)
  expect(await page.getByText(/didn’t work/).first().isVisible(), 'bad token: explains the link failed')
  expect(await page.getByText('That link is not valid.').isVisible(), 'bad token: surfaces the server reason')
})

// 4. Bare domain with nothing stored still guides you.
await run('no token', { blockStorage: true }, async (page) => {
  await page.goto(base + '/')
  await page.waitForTimeout(500)
  expect(await page.getByText('Open your personal link').isVisible(), 'no token: prompts for the link')
})

await b.close()
if (errors.length) { console.log('\nERRORS:\n' + errors.join('\n')); process.exit(1) }
console.log('\nauth checks ok')
