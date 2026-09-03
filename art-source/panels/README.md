# Full-resolution panel drop-off

Put individual panel images here and run:

```bash
node scripts/import-panels.mjs
```

It converts whatever it finds into optimised WebP in `public/characters/<set>/`,
replacing the soft versions cut from the contact sheets. Anything you haven't
uploaded keeps its existing tile, so you can do these a few at a time.

Accepts `.png`, `.jpg`, `.jpeg` or `.webp`. **Rename each file to match the list
below before uploading** — the name is how the app knows which tier it is.

## Filenames (same 18 in every set folder)

### Power levels — shown at these streak lengths
| File | Luffy | Bat Hero | Snoop | At |
|---|---|---|---|---|
| `level-1` | Base Luffy | Broke Bruce | Porch Chillin' | start |
| `level-2` | Gear 2 | Rooftop Vigilante | Hotbox Cruiser | 3 days |
| `level-3` | Gear 3 | Gadget Goblin | Studio Wizard | 7 days |
| `level-4` | Gear 4 | Prep-Time Demon | Intergalactic Float | 14 days |
| `level-5` | Gear 5 | Gotham Final Boss | Cloud Kingdom Boss | 30 days |

### Depleted — shown after this many consecutive days with any miss
| File | Luffy | Bat Hero | Snoop | After |
|---|---|---|---|---|
| `depleted-1` | Overslept | Overslept | Low Supply | 1 day |
| `depleted-2` | Skipped Training | Skipped Training | Pocket Check | 2 days |
| `depleted-3` | No Adventure | Utility Belt Empty | Crumb Detective | 3 days |
| `depleted-4` | Losing Haki | Batmobile Dead | Dry Spell | 4 days |
| `depleted-5` | Crew Is Concerned | Alfred Is Disappointed | Snack Meltdown | 5 days |
| `depleted-7` | Couch Potato Captain | Gotham Noticed | Existential Crisis | 7 days |
| `depleted-10` | Lost At Sea | Joker Took The Cave | The Void | 10+ days |

### Milestones — unlocked at these best-streak lengths
| File | Luffy | Bat Hero | Snoop | At |
|---|---|---|---|---|
| `milestone-3` | Mini Straw Hat | Mask | Tiny Blunt | 3 days |
| `milestone-7` | Going Merry | Batarang | Gold Lighter | 7 days |
| `milestone-14` | Devil Fruit | Smoke Bombs | Plush Robe | 14 days |
| `milestone-30` | Thousand Sunny | Grapple Gun | Lowrider Keys | 30 days |
| `milestone-50` | Wanted Poster | Armored Suit | Cloud Throne | 50 days |
| `milestone-70` | Pirate King Crown | City Legend | Cosmic Crown | 70 days |

Milestone images should be just the object — the app prints the day count itself,
so panels that bake in "60 DAYS" or "100 DAYS" would contradict it.
