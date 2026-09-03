# Character art

Every tier draws its own SVG by default. Drop a PNG here with the matching
filename and it replaces the drawing automatically — no code change, and a
missing file just falls back to the drawing, so partial sets are fine.

## Power levels (streak-driven)

| File | Tier | Unlocks at |
|---|---|---|
| `level-1.png` | Porch Chillin' | start |
| `level-2.png` | Hotbox Cruiser | 3-day streak |
| `level-3.png` | Studio Wizard | 7-day streak |
| `level-4.png` | Intergalactic Float | 14-day streak |
| `level-5.png` | Cloud Kingdom Boss | 30-day streak |

## Depleted states (consecutive days with any miss)

| File | Tier | Shows after |
|---|---|---|
| `depleted-1.png` | Low Supply | 1 day missed |
| `depleted-2.png` | Pocket Check | 2 days |
| `depleted-3.png` | Crumb Detective | 3 days |
| `depleted-4.png` | Dry Spell | 4 days |
| `depleted-5.png` | Snack Meltdown | 5 days |
| `depleted-7.png` | Existential Crisis | 7 days |
| `depleted-10.png` | The Void | 10+ days |

## Milestone objects (best-streak-driven)

`milestone-3.png`, `milestone-7.png`, `milestone-14.png`, `milestone-30.png`,
`milestone-50.png`, `milestone-70.png`

## Slicing a contact sheet

If you have one big grid image with all the panels on it, save it as
`source.png` in this folder and run:

```bash
node scripts/slice-characters.mjs
```

Edit the `GRID` coordinates at the top of that script to match your image
(they're fractions of width/height, so they work at any resolution), then
re-run until the crops line up.

## Note on `source.png`

`source.png` is only an input for the slicer — it is not referenced by the app.
After slicing, move it out of `public/` (or delete it) so the full-size contact
sheet isn't shipped to every visitor. `_preview.png` is likewise just a
check-your-work artifact.
