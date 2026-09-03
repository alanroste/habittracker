# Habit Tracker — MVP Spec

Shared habit tracker for a small friend group (4 users, extensible). Installable on phone as a PWA.
Backend: Supabase project `habittracker` (ref `acewcsoxgmvsnpyyukfb`, us-west-2, Postgres 17).

## Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Vite + React + TypeScript + Tailwind | Fast, small, easy to PWA-ify |
| PWA | `vite-plugin-pwa` (manifest + service worker) | "Add to Home Screen" on iOS/Android, offline shell |
| Data | Supabase (Postgres + PostgREST via `@supabase/supabase-js`) | Already provisioned |
| Auth | Per-user secret URL token, validated server-side by SQL functions | No passwords, matches "unique URL per user" |
| Hosting | Netlify (static) | Free, HTTPS (required for PWA install) |

## Auth model (unique URL per user)

Each user has a random `login_token`. Their URL is `https://<site>/u/<login_token>`.

- Opening the URL stores the token in `localStorage` and loads that user's profile. Bookmark / home-screen icon = permanent login.
- All tables have Row Level Security with **no direct access** for the anon key.
- Reads and writes go through `security definer` SQL functions (RPC) that take the token as the first argument and resolve it to a user. Wrong token = error.
- Friends' data is readable by any valid token (it's a shared group), so the friends page just calls `get_friends(token)`.
- Adding a 5th user = one `insert into users` (or an admin-only RPC). No code change.

Trade-off: the link *is* the password. Fine for a trusted friend group; regenerate a token if a link leaks.

## Habit categories

Fixed enum, displayed in a 2×2 grid on the dashboard:

| Position | Category | Enum | Examples |
|---|---|---|---|
| top-left | Health | `health` | supplements daily, gym 4×/week, cardio 3×/week |
| top-right | Mind | `mind` | read, chess, meditate |
| bottom-left | Business | `business` | any business goals |
| bottom-right | Do Not | `avoid` | ≤5 League games/week, ≤1 cheat meal/week, ≤1 rest day/week |

## Habit types & scoring

Each habit has a `frequency`:

| frequency | Meaning | Daily UI | Scored |
|---|---|---|---|
| `daily` | Every day | ✓ / ✗ each day | Per day: ✓ = hit, ✗ = miss |
| `per_week` (N) | Do it at least N times per week | ✓ on days done, ✗ not required | Per week: hit if count ≥ N by week end; mid-week is "on track" while still achievable |
| `limit_week` (N) | Do it at most N times per week (Do Not) | tap to count an occurrence | Per week: hit if count ≤ N; a miss the moment count > N |

Rules:
- Marking ✗ on a daily habit **requires a reason** (free text, e.g. "I'm a bum"). Reasons are visible to friends.
- Logs are per `(habit, date)`, upserted. Past days can be filled in retroactively from the calendar.
- Week = Monday–Sunday in the user's timezone. Each user stores a timezone (default from browser on first visit).

### Metrics (computed in SQL views/functions, not in the client)

- **On-track %** (headline number, shown next to each friend): `hits / (hits + misses)` over all scored items since the user started. 10 goals, 1 missed → 90%.
- **Per-category %**: same formula filtered by category.
- **Days logged**: count of days with ≥1 log. Shown top-centre of the dashboard as `logged / days since start`.
- **Missed days**: past days where a `daily` habit has no log. Shown in a calendar strip; tapping a missed day opens it for back-filling.
- **Streaks**: current and best consecutive-day streak for daily habits (per habit and overall).
- **Per-day history**: for each date, hits / misses / unlogged, for the analytics page.
- **Reasons log**: list of ✗ reasons, newest first (also fun on the friends page).

## Screens

1. **`/u/:token` (entry)** — validates token, saves it, redirects to onboarding if the user has no habits yet, else dashboard.
2. **Onboarding** — enter/confirm name, then 4 steps (Health → Mind → Business → Do Not). Each step: add habits with title + frequency + target. Business and Do Not can be skipped. Habits are editable later from Settings.
3. **Dashboard** (`/`) — top: name, on-track %, days logged (`12/14`) with a 14-day calendar strip highlighting missed days; body: 2×2 category grid, each habit row with ✓ and ✗ buttons (✗ opens a reason sheet). Date picker to view/log another day.
4. **Analytics** (`/stats`) — overall + per-category %, streaks, weekly bar chart of hits/misses, missed-reasons list, per-habit completion.
5. **Friends** (`/friends`) — list of all other users with on-track %; tap → read-only view of their dashboard + analytics.
6. **Settings** — edit habits, timezone, copy own login link.

Bottom tab bar: Today · Stats · Friends · Settings. Mobile-first, works on desktop.

## Database schema (draft)

```sql
create type habit_category as enum ('health','mind','business','avoid');
create type habit_frequency as enum ('daily','per_week','limit_week');
create type log_status as enum ('done','missed');

create table users (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  login_token text not null unique,          -- random, url-safe
  timezone    text not null default 'UTC',
  started_on  date not null default current_date,
  created_at  timestamptz not null default now()
);

create table habits (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  category     habit_category not null,
  title        text not null,
  frequency    habit_frequency not null default 'daily',
  target_count int not null default 1,       -- N for per_week / limit_week
  sort_order   int not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create table habit_logs (
  id         uuid primary key default gen_random_uuid(),
  habit_id   uuid not null references habits(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  log_date   date not null,
  status     log_status not null,
  count      int not null default 1,         -- occurrences that day (limit_week)
  reason     text,                           -- required when status = 'missed'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (habit_id, log_date),
  check (status <> 'missed' or reason is not null)
);

-- RLS: enable on all three, no policies for anon → only RPC can read/write.
-- RPC (security definer, all take p_token text first):
--   me(p_token)                         → user row
--   set_name(p_token, name, timezone)
--   upsert_habit(p_token, habit json) / delete_habit(p_token, habit_id)
--   log_habit(p_token, habit_id, date, status, reason, count)
--   day_view(p_token, date)             → habits + logs for that date
--   stats(p_token, user_id default null) → all metrics (own or a friend's)
--   friends(p_token)                    → other users + on-track %
```

## Build order

1. SQL migration: types, tables, RLS, RPC functions, metric views. Seed 4 users with tokens.
2. Vite app scaffold, Supabase client, token entry route, PWA manifest/icons.
3. Onboarding flow.
4. Dashboard + logging + reason sheet + calendar strip.
5. Analytics page.
6. Friends list + friend detail.
7. Settings, polish, deploy to Netlify, verify install on iPhone/Android.

## Out of scope for MVP (later)

Push reminders, comments/reactions on friends' misses, group challenges, photo proof, export.
