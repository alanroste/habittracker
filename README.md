# 70 Days — habit tracker for the crew

A small installable web app (PWA) where a group of friends track daily and weekly habits for a
70-day challenge, log honest excuses when they miss, and compare on-track percentages.

- **Frontend:** Vite + React + TypeScript + Tailwind, `vite-plugin-pwa` for home-screen install
- **Backend:** Supabase (Postgres). All access goes through token-authenticated SQL functions;
  tables are locked down with RLS. Schema and functions: `supabase/migrations/0001_init.sql`
- **Spec:** `docs/SPEC.md`

## Run locally

```bash
npm install
npm run dev
```

`.env` holds the public Supabase URL and publishable key (safe to ship in the client).

## Deploy (Netlify)

1. Netlify → *Add new project* → *Import from Git* → pick this repo.
2. Build settings are read from `netlify.toml` (`npm run build`, publish `dist`). Nothing else to set.
3. Open `https://<your-site>.netlify.app/u/<login_token>` on each phone, then install it (see below).

## Installing as an app

Each person should install the app from **their own link** (`/u/<login_token>`), not the bare
domain — that's what lets the installed icon remember who they are.

- **iPhone (Safari):** open your link, tap Share, then **Add to Home Screen**.
- **Android (Chrome):** open your link, tap the ⋮ menu, then **Install app** (or use the install
  banner shown on the dashboard, which offers a one-tap Install button when the browser supports it).

Under the hood: `netlify/functions/manifest.cjs` serves a web app manifest per visitor, at
`/app.webmanifest?u=<token>`, with that user's `/u/<token>` baked in as `start_url`. A small script
(`src/lib/manifest.ts`, run at startup) points the page's `<link rel="manifest">` at that URL once a
token is known. Without this, every install would open the generic `/` with no way to tell users
apart — and on iOS, an installed home-screen icon gets its own separate storage from Safari, so a
token only saved to `localStorage` isn't there on the icon's first cold launch. Baking the token into
`start_url` means every launch re-authenticates from the URL itself, so it's self-healing.

## Users and login links

There are no passwords. Each user has a secret `login_token`; their link is `/u/<login_token>`.
Anyone with the link can log as that user, so keep links private.

Add a user (Supabase SQL editor):

```sql
insert into users (name) values ('New Friend') returning login_token;
```

Reset a leaked link:

```sql
update users set login_token = replace(gen_random_uuid()::text, '-', '') where name = 'New Friend' returning login_token;
```

List all links:

```sql
select name, '/u/' || login_token as path from users order by name;
```

## How scoring works

| Habit type | Logged how | Counts as |
|---|---|---|
| Every day | ✓ or ✗ (✗ requires a reason) | one hit or miss per day; an unlogged past day counts against you until filled in |
| At least N / week | ✓ on the days you do it | one hit or miss per week, decided when the week ends (or as soon as it's achieved / impossible) |
| At most N / week | tap + for each occurrence | one hit per week if you stay at or under N; a miss the moment you go over |

**On track %** = hits ÷ (hits + misses + unlogged). Open items (today, or a week still in progress)
don't count yet. Weeks run Monday–Sunday in the user's timezone. The 70-day clock starts the day
onboarding is completed.

## Scripts

- `node scripts/make-icons.mjs` — regenerate the PWA icons in `public/`
- `node scripts/smoke.mjs <url> <outDir>` — browser smoke test against a mocked backend
  (`npx vite preview` first)
- `node scripts/auth-check.mjs <url>` — proves the login link still works when the browser
  blocks storage (private mode / in-app browsers)
- `node scripts/slice-characters.mjs [set]` — re-cut the character tiles from the contact
  sheets in `art-source/`
- `node scripts/import-panels.mjs` — replace tiles with full-resolution panels dropped in
  `art-source/panels/<set>/` (see that folder's README for filenames)
- `node scripts/character-states.mjs <url> <outDir>` — render the character card across states
