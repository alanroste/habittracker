/**
 * Slice one contact-sheet image into the individual character tiles.
 *
 * Put your grid image at public/characters/source.png, tune GRID below, then:
 *   node scripts/slice-characters.mjs
 *
 * Coordinates are FRACTIONS of the source image's width/height, so they work
 * whatever resolution the source is. Run it, look at the output PNGs, nudge the
 * numbers, run again.
 *
 * Uses headless Chromium (already installed here) to do the cropping, since
 * this box has no ImageMagick or Pillow.
 */
import { chromium } from 'playwright'
import { existsSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = process.argv[2] ?? resolve(root, 'public/characters/source.png')
const OUT_DIR = resolve(root, 'public/characters')

// Each row: y-range of the row, then the x-ranges of the tiles across it.
// Fractions of the full image: [left, top, right, bottom].
const GRID = {
  // 5 "powered up" panels across the top
  levels: {
    names: ['level-1', 'level-2', 'level-3', 'level-4', 'level-5'],
    top: 0.045,
    bottom: 0.475,
    left: 0.198,
    right: 0.996,
    gap: 0.004,
  },
  // 7 "depleted" panels across the middle
  depleted: {
    names: ['depleted-1', 'depleted-2', 'depleted-3', 'depleted-4', 'depleted-5', 'depleted-7', 'depleted-10'],
    top: 0.517,
    bottom: 0.812,
    left: 0.198,
    right: 0.966,
    gap: 0.004,
  },
  // 6 milestone objects across the bottom
  milestones: {
    names: ['milestone-3', 'milestone-7', 'milestone-14', 'milestone-30', 'milestone-50', 'milestone-70'],
    top: 0.828,
    bottom: 0.985,
    left: 0.152,
    right: 0.80,
    gap: 0.004,
  },
}

function tiles() {
  const out = []
  for (const row of Object.values(GRID)) {
    const n = row.names.length
    const span = (row.right - row.left) / n
    row.names.forEach((name, i) => {
      out.push({
        name,
        left: row.left + i * span + row.gap / 2,
        right: row.left + (i + 1) * span - row.gap / 2,
        top: row.top,
        bottom: row.bottom,
      })
    })
  }
  return out
}

if (!existsSync(SOURCE)) {
  console.error(`No source image at ${SOURCE}\nSave your grid image there (or pass a path as the first argument) and re-run.`)
  process.exit(1)
}
mkdirSync(OUT_DIR, { recursive: true })

const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/opt/pw-browsers/chromium' })
const page = await browser.newPage()
await page.goto('about:blank')

const { width, height } = await page.evaluate(async (src) => {
  const img = new Image()
  img.src = src
  await img.decode()
  Object.assign(window, { __img: img })
  return { width: img.naturalWidth, height: img.naturalHeight }
}, `file://${SOURCE}`)

console.log(`source ${width}x${height}`)

for (const t of tiles()) {
  const box = {
    x: Math.round(t.left * width),
    y: Math.round(t.top * height),
    w: Math.round((t.right - t.left) * width),
    h: Math.round((t.bottom - t.top) * height),
  }
  const dataUrl = await page.evaluate((b) => {
    const img = window.__img
    const c = document.createElement('canvas')
    c.width = b.w
    c.height = b.h
    c.getContext('2d').drawImage(img, b.x, b.y, b.w, b.h, 0, 0, b.w, b.h)
    return c.toDataURL('image/png')
  }, box)

  const buf = Buffer.from(dataUrl.split(',')[1], 'base64')
  const { writeFileSync } = await import('node:fs')
  writeFileSync(resolve(OUT_DIR, `${t.name}.png`), buf)
  console.log(`  ${t.name}.png  ${box.w}x${box.h} @ ${box.x},${box.y}`)
}

await browser.close()
console.log('\nDone. Check the crops, tune GRID in this file if they are off, re-run.')
