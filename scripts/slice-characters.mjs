/**
 * Slice the character contact sheets into individual tiles.
 *
 *   node scripts/slice-characters.mjs            # all sets
 *   node scripts/slice-characters.mjs luffy      # one set
 *
 * Level and depleted crops keep the WHOLE panel, printed title and caption
 * included — the card shows them large and lets the artwork carry its own words.
 * Milestone crops stay art-only: those tiles print day numbers that disagree
 * between sheets (two say 60/100 where the challenge tops out at 70), so the app
 * supplies those labels instead.
 *
 * Coordinates are FRACTIONS of each source image, so they survive any resize.
 * Sheets live in art-source/ (kept out of public/ so 9MB isn't served).
 * Run it, open art-source/_preview.png, nudge, re-run.
 * Tiles are written as WebP at high quality — these panels are only ~250px wide
 * in the source sheets and get upscaled on screen, so compression artifacts show.
 * Bigger source sheets are the only real way to sharpen them further.
 */
import { chromium } from 'playwright'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(root, 'public/characters')
const SRC = resolve(root, 'art-source')

const LEVELS = ['level-1', 'level-2', 'level-3', 'level-4', 'level-5']
const DEPLETED = ['depleted-1', 'depleted-2', 'depleted-3', 'depleted-4', 'depleted-5', 'depleted-7', 'depleted-10']
const MILESTONES = ['milestone-3', 'milestone-7', 'milestone-14', 'milestone-30', 'milestone-50', 'milestone-70']

/** left/right/top/bottom are fractions of the source image. */
const SETS = {
  snoop: {
    source: 'snoop-sheet.png',
    rows: [
      { names: LEVELS, left: 0.198, right: 0.995, top: 0.043, bottom: 0.470, gap: 0.003, maxWidth: 640 },
      { names: DEPLETED, left: 0.189, right: 0.962, top: 0.516, bottom: 0.810, gap: 0.003, maxWidth: 640 },
      { names: MILESTONES, left: 0.149, right: 0.790, top: 0.864, bottom: 0.941, gap: 0.044, maxWidth: 200 },
    ],
  },
  batman: {
    source: 'batman-sheet.png',
    rows: [
      { names: LEVELS, left: 0.154, right: 0.996, top: 0.048, bottom: 0.425, gap: 0.003, maxWidth: 640 },
      { names: DEPLETED, left: 0.142, right: 0.990, top: 0.480, bottom: 0.800, gap: 0.003, maxWidth: 640 },
      { names: MILESTONES, left: 0.100, right: 0.790, top: 0.850, bottom: 0.927, gap: 0.044, maxWidth: 200 },
    ],
  },
  luffy: {
    source: 'luffy-sheet.png',
    rows: [
      { names: LEVELS, left: 0.218, right: 0.996, top: 0.062, bottom: 0.420, gap: 0.003, maxWidth: 640 },
      { names: DEPLETED, left: 0.182, right: 0.996, top: 0.478, bottom: 0.745, gap: 0.003, maxWidth: 640 },
      { names: MILESTONES, left: 0.152, right: 0.667, top: 0.845, bottom: 0.927, gap: 0.044, maxWidth: 200 },
    ],
  },
}

function tilesFor(set) {
  const out = []
  for (const row of set.rows) {
    const span = (row.right - row.left) / row.names.length
    row.names.forEach((name, i) => {
      out.push({
        name,
        left: row.left + i * span + row.gap / 2,
        right: row.left + (i + 1) * span - row.gap / 2,
        top: row.top,
        bottom: row.bottom,
        maxWidth: row.maxWidth ?? 420,
      })
    })
  }
  return out
}

const only = process.argv[2]
const wanted = only ? { [only]: SETS[only] } : SETS
if (only && !SETS[only]) {
  console.error(`Unknown set "${only}". Known: ${Object.keys(SETS).join(', ')}`)
  process.exit(1)
}

const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/opt/pw-browsers/chromium' })
const page = await browser.newPage()
await page.goto('about:blank')
const written = []

for (const [setName, set] of Object.entries(wanted)) {
  const src = resolve(SRC, set.source)
  if (!existsSync(src)) {
    console.warn(`skipping ${setName}: no ${set.source}`)
    continue
  }
  const dir = resolve(OUT, setName)
  mkdirSync(dir, { recursive: true })

  // Pass the image in as a data URL — Chromium refuses to decode file:// images
  // loaded from about:blank.
  const dataUrl = `data:image/png;base64,${readFileSync(src).toString('base64')}`
  const { width, height } = await page.evaluate(async (url) => {
    const img = new Image()
    img.src = url
    await img.decode()
    window.__img = img
    return { width: img.naturalWidth, height: img.naturalHeight }
  }, dataUrl)
  console.log(`\n${setName} (${set.source} ${width}x${height})`)

  for (const t of tilesFor(set)) {
    const box = {
      x: Math.round(t.left * width),
      y: Math.round(t.top * height),
      w: Math.round((t.right - t.left) * width),
      h: Math.round((t.bottom - t.top) * height),
    }
    const png = await page.evaluate((b) => {
      const scale = Math.min(1, b.max / b.w)
      const c = document.createElement('canvas')
      c.width = Math.round(b.w * scale)
      c.height = Math.round(b.h * scale)
      const ctx = c.getContext('2d')
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(window.__img, b.x, b.y, b.w, b.h, 0, 0, c.width, c.height)
      return c.toDataURL('image/webp', 0.95)
    }, { ...box, max: t.maxWidth })
    const file = resolve(dir, `${t.name}.webp`)
    writeFileSync(file, Buffer.from(png.split(',')[1], 'base64'))
    written.push({ set: setName, name: t.name, file, w: box.w, h: box.h })
  }
  const lv = written.filter((w) => w.set === setName && w.name === 'level-1')[0]
  console.log(`  wrote ${tilesFor(set).length} tiles -> public/characters/${setName}/  (panel ${lv?.w}x${lv?.h}px)`)
}

// Labelled contact sheet so alignment is checkable in one look.
if (written.length) {
  const bySet = {}
  for (const w of written) (bySet[w.set] ??= []).push(w)
  const html = Object.entries(bySet)
    .map(
      ([s, items]) => `
      <h2 style="font:600 16px system-ui;color:#f3f4f6;margin:14px 10px 6px">${s}</h2>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;padding:0 10px">
        ${items
          .map(
            (i) => `<figure style="margin:0">
              <img src="data:image/webp;base64,${readFileSync(i.file).toString('base64')}"
                   style="width:100%;display:block;border:1px solid #2a3040;border-radius:6px;background:#000">
              <figcaption style="text-align:center;padding-top:3px;font:10px system-ui;color:#a3aab8">${i.name}</figcaption>
            </figure>`,
          )
          .join('')}
      </div>`,
    )
    .join('')
  await page.setViewportSize({ width: 1400, height: 900 })
  await page.setContent(`<body style="margin:0;background:#0f1115">${html}</body>`)
  await page.waitForTimeout(300)
  await page.screenshot({ path: resolve(SRC, '_preview.png'), fullPage: true })
  console.log(`\nWrote art-source/_preview.png — open it to check alignment.`)
}

await browser.close()
console.log('Done. If crops are off, tune SETS at the top of this file and re-run.')
