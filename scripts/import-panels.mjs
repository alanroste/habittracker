/**
 * Import full-resolution panel images and replace the soft tiles cut from the
 * contact sheets.
 *
 *   1. drop images in art-source/panels/<set>/, named level-3.png, depleted-7.png, …
 *   2. node scripts/import-panels.mjs
 *
 * Converts to WebP sized for a full-width phone card at 3x, writes them to
 * public/characters/<set>/, and leaves any tier you haven't supplied alone —
 * so you can upload a few at a time.
 */
import { chromium } from 'playwright'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { resolve, dirname, extname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const IN = resolve(root, 'art-source/panels')
const OUT = resolve(root, 'public/characters')

const VALID = new Set([
  'level-1', 'level-2', 'level-3', 'level-4', 'level-5',
  'depleted-1', 'depleted-2', 'depleted-3', 'depleted-4', 'depleted-5', 'depleted-7', 'depleted-10',
  'milestone-3', 'milestone-7', 'milestone-14', 'milestone-30', 'milestone-50', 'milestone-70',
])
const EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp'])
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }

// A level/depleted panel fills the card width (~390px) — 1000px covers 2-3x DPR.
// Milestones render at ~40px, so they never need more than a few hundred.
const maxWidthFor = (name) => (name.startsWith('milestone') ? 320 : 1000)

const sets = readdirSync(IN, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)

if (!sets.length) {
  console.error(`No set folders under ${IN}`)
  process.exit(1)
}

const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/opt/pw-browsers/chromium' })
const page = await browser.newPage()
await page.goto('about:blank')

let imported = 0
const skipped = []

for (const set of sets) {
  const dir = resolve(IN, set)
  const files = readdirSync(dir).filter((f) => EXTS.has(extname(f).toLowerCase()))
  if (!files.length) continue

  const outDir = resolve(OUT, set)
  mkdirSync(outDir, { recursive: true })
  console.log(`\n${set}`)

  for (const file of files) {
    const name = basename(file, extname(file)).toLowerCase()
    if (!VALID.has(name)) {
      skipped.push(`${set}/${file} — name must be one of level-1…5, depleted-1/2/3/4/5/7/10, milestone-3/7/14/30/50/70`)
      continue
    }
    const src = resolve(dir, file)
    const ext = extname(file).toLowerCase()
    const dataUrl = `data:${MIME[ext]};base64,${readFileSync(src).toString('base64')}`

    const { png, w, h, ow } = await page.evaluate(async ({ url, max }) => {
      const img = new Image()
      img.src = url
      await img.decode()
      const scale = Math.min(1, max / img.naturalWidth)
      const c = document.createElement('canvas')
      c.width = Math.round(img.naturalWidth * scale)
      c.height = Math.round(img.naturalHeight * scale)
      const ctx = c.getContext('2d')
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, c.width, c.height)
      return { png: c.toDataURL('image/webp', 0.92), w: c.width, h: c.height, ow: img.naturalWidth }
    }, { url: dataUrl, max: maxWidthFor(name) })

    const dest = resolve(outDir, `${name}.webp`)
    const before = existsSync(dest) ? statSync(dest).size : 0
    writeFileSync(dest, Buffer.from(png.split(',')[1], 'base64'))
    const after = statSync(dest).size
    console.log(
      `  ${name.padEnd(13)} ${String(ow).padStart(5)}px source -> ${w}x${h}` +
      `  ${(after / 1024).toFixed(0)}KB${before ? ` (was ${(before / 1024).toFixed(0)}KB)` : ''}`,
    )
    imported++
  }
}

await browser.close()

if (skipped.length) {
  console.log('\nSkipped:')
  for (const s of skipped) console.log('  ' + s)
}
console.log(`\nImported ${imported} panel${imported === 1 ? '' : 's'}.`)
if (!imported) console.log('Nothing to do — drop images into art-source/panels/<set>/ first.')
