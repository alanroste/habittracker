# Character art

Three sets ship with the app: `luffy/`, `batman/`, `snoop/`. Each user picks one
in Settings (or during onboarding); it is stored on their row as `character_set`.

Every set holds the same 18 tiles, as WebP:

| File | Shown when |
|---|---|
| `level-1.webp` … `level-5.webp` | streak of 0 / 3 / 7 / 14 / 30 days |
| `depleted-1.webp` … `depleted-10.webp` | 1 / 2 / 3 / 4 / 5 / 7 / 10+ consecutive days with any miss |
| `milestone-3.webp` … `milestone-70.webp` | best streak reaches 3 / 7 / 14 / 30 / 50 / 70 days |

A missing file falls back to a plain placeholder rather than a broken image, so
partial sets are fine.

Tier names and captions live in `src/lib/character.ts`, not in the images — the
crops deliberately exclude each sheet's printed titles so the app can render
real text (and so the sheets' printed day numbers, which disagree with each
other, don't matter).

## Regenerating from the contact sheets

Full-size sheets are in `art-source/` (kept out of `public/` so ~9MB isn't
served to every visitor).

```bash
node scripts/slice-characters.mjs          # all sets
node scripts/slice-characters.mjs luffy    # just one
```

It writes the tiles plus `art-source/_preview.png`, a labelled contact sheet of
every crop. Check that, tune the fractional `SETS` coordinates at the top of the
script, and re-run until the panels line up.

## Adding a fourth set

1. Drop the sheet in `art-source/`.
2. Add its crop coordinates to `SETS` in `scripts/slice-characters.mjs`, run it.
3. Add the names/captions to `CHARACTER_SETS` in `src/lib/character.ts`.
4. Add the key to the `character_set` enum in Postgres:
   `alter type character_set add value 'newname';`
