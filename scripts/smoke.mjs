// Browser smoke test with a mocked Supabase RPC layer (the sandbox cannot reach supabase.co).
// Usage: node scripts/smoke.mjs <baseUrl> <outDir>
import { chromium } from 'playwright'
const [base = 'http://localhost:4173', out = 'shots'] = process.argv.slice(2)

const TOKEN = 'f7f8c85f22984b998e9ca4f73b3ea4ae'
const ME = { id: 'u4', name: 'Alan', timezone: 'America/New_York', started_on: '2026-08-27', challenge_days: 70, onboarded: true, character_set: 'luffy' }
const today = '2026-09-02'
const habits = [
  { id: 'h1', category: 'health', title: 'Supplements', frequency: 'daily', target_count: 1, sort_order: 0, starts_on: ME.started_on, time_of_day: 'morning' },
  { id: 'h2', category: 'health', title: 'Gym', frequency: 'per_week', target_count: 4, sort_order: 1, starts_on: ME.started_on, time_of_day: 'evening' },
  { id: 'h3', category: 'health', title: 'Cardio', frequency: 'per_week', target_count: 3, sort_order: 2, starts_on: ME.started_on, time_of_day: 'afternoon' },
  { id: 'h4', category: 'mind', title: 'Read 20 pages', frequency: 'daily', target_count: 1, sort_order: 0, starts_on: ME.started_on, time_of_day: 'morning' },
  { id: 'h5', category: 'mind', title: 'Meditate', frequency: 'daily', target_count: 1, sort_order: 1, starts_on: ME.started_on, time_of_day: 'evening' },
  { id: 'h6', category: 'business', title: '10 cold emails', frequency: 'daily', target_count: 1, sort_order: 0, starts_on: ME.started_on, time_of_day: 'morning' },
  { id: 'h7', category: 'avoid', title: 'League games', frequency: 'limit_week', target_count: 5, sort_order: 0, starts_on: ME.started_on, time_of_day: 'morning' },
  { id: 'h8', category: 'avoid', title: 'Cheat meals', frequency: 'limit_week', target_count: 1, sort_order: 1, starts_on: ME.started_on, time_of_day: 'evening' },
]
const dayView = habits.map((h, i) => ({
  ...h,
  log: i === 0 ? { status: 'done', count: 1, reason: null } : i === 3 ? { status: 'missed', count: 0, reason: "I'm a bum" } : i === 6 ? { status: 'done', count: 2, reason: null } : null,
  week_count: h.frequency === 'per_week' ? 2 : h.frequency === 'limit_week' ? (i === 6 ? 6 : 0) : i === 0 ? 1 : 0,
}))
const daily_history = ['2026-08-27','2026-08-28','2026-08-29','2026-08-30','2026-08-31','2026-09-01','2026-09-02'].map((date, i) => (
  i === 2 ? { date, hits: 2, misses: 2, unlogged: 0, pending: 0 }
  : i === 4 ? { date, hits: 1, misses: 0, unlogged: 3, pending: 0 }
  : i === 6 ? { date, hits: 1, misses: 1, unlogged: 0, pending: 2 }
  : { date, hits: 4, misses: 0, unlogged: 0, pending: 0 }))
const tally = (hits, misses, unlogged, pending) => ({ hits, misses, unlogged, pending, pct: hits + misses + unlogged ? Math.round(1000 * hits / (hits + misses + unlogged)) / 10 : 100 })
const STATS = {
  user: ME, today, day_number: 7, days_total: 70, days_left: 63, end_date: '2026-11-04',
  days_logged: 5, days_elapsed: 7,
  missed_days: [{ date: '2026-08-31', unlogged: 3 }],
  overall: tally(22, 3, 3, 4),
  categories: [
    { category: 'health', ...tally(8, 0, 1, 2) }, { category: 'mind', ...tally(9, 3, 1, 0) },
    { category: 'business', ...tally(5, 0, 1, 0) }, { category: 'avoid', ...tally(0, 0, 0, 2) },
  ],
  habits: habits.map((h, i) => ({ ...h, ...tally(i === 3 ? 4 : 6, i === 3 ? 2 : 0, i === 4 ? 1 : 0, h.frequency === 'daily' ? 0 : 1), week_count: 2 })),
  daily_history,
  weekly_history: [{ week_start: '2026-08-24', hits: 3, misses: 1, pending: 0 }, { week_start: '2026-08-31', hits: 0, misses: 0, pending: 4 }],
  streak: { current: 0, best: 3 },
  reasons: [
    { date: '2026-09-02', habit: 'Read 20 pages', category: 'mind', reason: "I'm a bum" },
    { date: '2026-08-29', habit: 'Meditate', category: 'mind', reason: 'Forgot' },
    { date: '2026-08-29', habit: 'Read 20 pages', category: 'mind', reason: 'Too tired' },
  ],
}
const GROUP_STATS = {
  categories: [
    { category: 'health', hits: 15, misses: 1, unlogged: 1, pending: 3, pct: 88.2 },
    { category: 'mind', hits: 9, misses: 6, unlogged: 3, pending: 0, pct: 50 },
    { category: 'business', hits: 8, misses: 0, unlogged: 1, pending: 0, pct: 88.9 },
    { category: 'avoid', hits: 4, misses: 1, unlogged: 0, pending: 2, pct: 80 },
  ],
  users: [
    { id: 'u4', name: 'Alan', onboarded: true, overall: { hits: 22, misses: 3, unlogged: 3, pending: 4, pct: 78.6 },
      categories: [
        { category: 'health', hits: 8, misses: 0, unlogged: 1, pending: 2, pct: 88.9 },
        { category: 'mind', hits: 9, misses: 3, unlogged: 1, pending: 0, pct: 69.2 },
        { category: 'business', hits: 5, misses: 0, unlogged: 1, pending: 0, pct: 83.3 },
      ] },
    { id: 'u1', name: 'Marco', onboarded: true, overall: { hits: 27, misses: 1, unlogged: 0, pending: 0, pct: 96.4 },
      categories: [
        { category: 'health', hits: 7, misses: 1, unlogged: 0, pending: 1, pct: 87.5 },
        { category: 'mind', hits: 0, misses: 3, unlogged: 2, pending: 0, pct: 0 },
        { category: 'avoid', hits: 4, misses: 1, unlogged: 0, pending: 2, pct: 80 },
      ] },
    { id: 'u2', name: 'Dev', onboarded: true, overall: { hits: 20, misses: 6, unlogged: 2, pending: 0, pct: 71.4 },
      categories: [
        { category: 'business', hits: 3, misses: 0, unlogged: 0, pending: 0, pct: 100 },
      ] },
    { id: 'u3', name: 'Friend 3', onboarded: false, overall: { hits: 0, misses: 0, unlogged: 0, pending: 0, pct: 100 }, categories: [] },
  ],
}
const GROUP_HABITS = [
  { habit_id: 'h1', user_id: 'u4', user_name: 'Alan', category: 'health', title: 'Supplements', frequency: 'daily', target_count: 1, time_of_day: 'morning', week_count: 1, status: 'done' },
  { habit_id: 'h2', user_id: 'u4', user_name: 'Alan', category: 'health', title: 'Gym', frequency: 'per_week', target_count: 4, time_of_day: 'evening', week_count: 2, status: 'open' },
  { habit_id: 'g1', user_id: 'u1', user_name: 'Marco', category: 'health', title: 'Cold shower', frequency: 'daily', target_count: 1, time_of_day: 'morning', week_count: 0, status: 'missed' },
  { habit_id: 'g2', user_id: 'u1', user_name: 'Marco', category: 'mind', title: 'Chess', frequency: 'per_week', target_count: 3, time_of_day: 'anytime', week_count: 1, status: 'open' },
  { habit_id: 'g3', user_id: 'u2', user_name: 'Dev', category: 'business', title: 'Cold emails', frequency: 'daily', target_count: 1, time_of_day: 'afternoon', week_count: 1, status: 'done' },
  { habit_id: 'g4', user_id: 'u1', user_name: 'Marco', category: 'avoid', title: 'League games', frequency: 'limit_week', target_count: 5, time_of_day: 'anytime', week_count: 7, status: 'over' },
]
const GROUP_REASONS = [
  { date: '2026-09-02', user_id: 'u4', user_name: 'Alan', habit: 'Read 20 pages', category: 'mind', reason: "I'm a bum" },
  { date: '2026-09-01', user_id: 'u1', user_name: 'Marco', habit: 'Meditate', category: 'mind', reason: 'Forgot' },
  { date: '2026-08-31', user_id: 'u2', user_name: 'Dev', habit: 'Cardio', category: 'health', reason: 'Too tired' },
  { date: '2026-08-29', user_id: 'u4', user_name: 'Alan', habit: 'Meditate', category: 'mind', reason: 'No time' },
]
const FRIENDS = [
  { id: 'u1', name: 'Marco', timezone: 'UTC', started_on: '2026-08-27', challenge_days: 70, onboarded: true, pct: 96.4, hits: 27, misses: 1, unlogged: 0, day_number: 7, habit_count: 6, character_set: 'batman', streak: { current: 9, best: 12 }, missed_run: 0 },
  { id: 'u2', name: 'Dev', timezone: 'UTC', started_on: '2026-08-27', challenge_days: 70, onboarded: true, pct: 71, hits: 20, misses: 6, unlogged: 2, day_number: 7, habit_count: 5, character_set: 'snoop', streak: { current: 0, best: 4 }, missed_run: 3 },
  { id: 'u3', name: 'Friend 3', timezone: 'UTC', started_on: '2026-09-03', challenge_days: 70, onboarded: false, pct: 100, hits: 0, misses: 0, unlogged: 0, day_number: 1, habit_count: 0, character_set: 'luffy', streak: { current: 0, best: 0 }, missed_run: 0 },
]

let onboarded = true
const calls = []
async function mock(route) {
  const url = route.request().url()
  const fn = url.split('/rpc/')[1]
  const body = route.request().postDataJSON?.() ?? {}
  calls.push(fn)
  const json = (data) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) })
  const err = (message) => route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message, code: 'P0001' }) })
  switch (fn) {
    case 'me': return body.p_token === TOKEN ? json({ ...ME, onboarded, today, login_token: TOKEN }) : err('invalid token')
    case 'update_profile': return json({ ...ME, name: body.p_name, timezone: body.p_timezone, onboarded, today, login_token: TOKEN })
    case 'complete_onboarding': onboarded = true; return json({ ...ME, onboarded, today, login_token: TOKEN })
    case 'set_character': return json({ ...ME, character_set: body.p_set, onboarded, today, login_token: TOKEN })
    case 'my_habits': return json(habits)
    case 'upsert_habit': return json({ id: 'new', category: body.p_category, title: body.p_title, frequency: body.p_frequency, target_count: body.p_target_count, sort_order: 0, starts_on: today })
    case 'delete_habit': case 'clear_log': return json(null)
    case 'log_habit': return body.p_status === 'missed' && !body.p_reason ? err('reason required') : json({ ok: true })
    case 'day_view': return json(dayView)
    case 'stats': return json(body.p_user_id ? { ...STATS, user: { ...ME, id: 'u1', name: 'Marco' } } : STATS)
    case 'friends': return json(FRIENDS)
    case 'group_stats': return json(GROUP_STATS)
    case 'group_reasons': return json(GROUP_REASONS)
    case 'group_habits': return json(GROUP_HABITS)
    case 'list_members': return json([{ id: 'u4', name: 'Alan', character_set: 'luffy' }, { id: 'u1', name: 'Marco', character_set: 'batman' }])
    case 'sign_in_as': return json(ME)
    case 'set_habit_time': return json({ ...habits[0], time_of_day: body.p_time_of_day })
    default: return err('unknown fn ' + fn)
  }
}

const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await ctx.route('**/rest/v1/rpc/**', mock)
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => { if (m.type() === 'error' && !/status of 400/.test(m.text())) errors.push(m.text()) })
const shot = (n) => page.screenshot({ path: `${out}/${n}.png`, fullPage: true })
const expect = (cond, msg) => { if (!cond) { errors.push('ASSERT: ' + msg) } }

// 1. no token
await page.goto(base + '/'); await page.waitForTimeout(300); await shot('00-no-token')
expect(await page.getByText('Who are you?').isVisible(), 'no-token screen offers the name picker')

// 2. bad link
await page.goto(base + '/u/badtoken'); await page.waitForTimeout(500); await shot('01-bad-link')
expect(await page.getByText('not valid').isVisible(), 'bad link message')

// 3. onboarding (not onboarded yet)
onboarded = false
await page.goto(base + '/u/' + TOKEN); await page.waitForURL(base + '/onboarding'); await page.waitForTimeout(300); await shot('02-onboarding-name')
await page.getByPlaceholder('Name').fill('Alan'); await page.getByRole('button', { name: 'Next' }).click(); await page.waitForTimeout(300); await shot('03-onboarding-health')
await page.getByPlaceholder('e.g. Take supplements').fill('Creatine'); await page.getByRole('button', { name: 'Add' }).click(); await page.waitForTimeout(200)
for (let i = 0; i < 3; i++) { await page.getByRole('button', { name: /Next|Skip/ }).click(); await page.waitForTimeout(200) }
await shot('04-onboarding-avoid'); await page.getByRole('button', { name: /Next|Skip/ }).click(); await page.waitForTimeout(200); await shot('05-onboarding-review')
await page.getByRole('button', { name: 'Start my 70 days' }).click(); await page.waitForURL(base + '/'); await page.waitForTimeout(500)

// 4. landing page is now the To-Do list
await shot('06-todo-landing')
expect(await page.getByRole('heading', { name: 'To-do today' }).isVisible(), 'to-do is the landing page')

// 4a. account dashboard with the character
await page.getByRole('link', { name: 'Me' }).click(); await page.waitForTimeout(500)
await shot('06-dashboard')
expect(await page.getByText('Day 7 of 70').isVisible(), 'day counter')
expect(await page.getByText('Streak milestones').isVisible(), 'milestone shelf')
expect(await page.getByText('The ladder').isVisible(), 'level ladder')
expect(await page.locator('img[src*="/characters/luffy/"]').first().isVisible(), 'character art loads for the chosen set')
expect(await page.getByText('days logged').isVisible(), 'days logged')
expect(await page.getByText("I'm a bum").first().isVisible(), 'reason shown on row')
// mark Meditate missed → reason sheet → submit
const meditate = page.locator('div', { hasText: /^Meditate/ }).locator('..').getByRole('button', { name: 'Mark missed' }).first()
await meditate.click(); await page.waitForTimeout(200); await page.screenshot({ path: `${out}/07-reason-sheet.png` })
await page.getByRole('button', { name: 'Too tired' }).click(); await page.getByRole('button', { name: 'Log the miss' }).click(); await page.waitForTimeout(300)
expect(calls.includes('log_habit'), 'log_habit called')
// limit counter
await page.getByRole('button', { name: 'Add one' }).first().click(); await page.waitForTimeout(200)
// previous day
await page.getByRole('button', { name: 'Previous day' }).click(); await page.waitForTimeout(200)
expect(await page.getByText('Yesterday').isVisible(), 'yesterday label')
await page.getByText('Back to today').click()

// 4b. to-do tab
await page.getByRole('link', { name: 'To-Do' }).click(); await page.waitForURL(base + '/'); await page.waitForTimeout(400); await shot('07b-todo')
expect(await page.getByRole('heading', { name: 'To-do today' }).isVisible(), 'todo heading')
expect(await page.getByText('MORNING').isVisible(), 'morning section')
expect(await page.getByText('EVENING').isVisible(), 'evening section')
await page.getByRole('button', { name: /Change when/ }).first().click(); await page.waitForTimeout(300)
await page.screenshot({ path: `${out}/07c-todo-move.png` })
expect(await page.getByRole('dialog').isVisible(), 'time-of-day sheet opens')
await page.getByRole('button', { name: /Afternoon/ }).click(); await page.waitForTimeout(300)
expect(calls.includes('set_habit_time'), 'set_habit_time called')

// 5. stats
await page.getByRole('link', { name: 'Stats' }).click(); await page.waitForTimeout(400); await shot('08-stats')
expect(await page.getByText('70-day map').isVisible(), 'heatmap')
expect(await page.getByText('Excuses').isVisible(), 'excuses')
expect(await page.getByText("Where you're slipping").isVisible(), 'slips section')
expect(await page.getByText('Your weak day').isVisible(), 'weekday pattern')

// 6. friends: leaderboard, group, and I'm a bum tabs
await page.getByRole('link', { name: 'Friends' }).click(); await page.waitForTimeout(400); await shot('09-friends')
expect(await page.getByText('Marco').isVisible(), 'friend row')
expect(await page.locator('img[alt="Gadget Goblin"]').first().isVisible(), "friend's character shown on the leaderboard")

await page.getByRole('button', { name: 'Group' }).click(); await page.waitForTimeout(400); await shot('09b-friends-group')
expect(await page.getByText('The group, combined').isVisible(), 'group combined section')
await page.getByRole('button', { name: /Health.*see habits/s }).click(); await page.waitForTimeout(400)
expect(await page.getByText('Cold shower').isVisible(), 'drill-down shows a friend habit')
expect(await page.getByRole('button', { name: /Health.*hide habits/s }).isVisible(), 'drill-down toggles open')
await shot('09b2-group-drilldown')

await page.getByRole('button', { name: "I'm a Bum" }).click(); await page.waitForTimeout(400); await shot('09c-friends-bum')
expect(await page.getByText("I'm a bum").first().isVisible(), 'excuse text shown')
expect(await page.getByText('Marco').first().isVisible(), 'excuse author shown')

await page.getByRole('button', { name: 'Leaderboard' }).click(); await page.waitForTimeout(300)
await page.getByText('Marco').click(); await page.waitForTimeout(500); await shot('10-friend-detail')
expect(await page.getByRole('heading', { name: 'Marco' }).isVisible(), 'friend detail')

// 7. settings
await page.getByRole('link', { name: 'Settings' }).click(); await page.waitForTimeout(400); await shot('11-settings')
expect((await page.locator('input[readonly]').inputValue()).includes('/u/' + TOKEN), 'login link shown')

// 8. desktop width dashboard
await page.setViewportSize({ width: 1100, height: 900 }); await page.goto(base + '/me'); await page.waitForTimeout(600); await shot('12-dashboard-desktop')

// 9. manifest + sw
const man = await page.request.get(base + '/manifest.webmanifest'); expect(man.ok(), 'manifest served')
const sw = await page.request.get(base + '/sw.js'); expect(sw.ok(), 'sw served')

await b.close()
console.log('RPC calls:', [...new Set(calls)].join(', '))
if (errors.length) { console.log('ERRORS:\n' + errors.join('\n')); process.exit(1) }
console.log('smoke ok')
