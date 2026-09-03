import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'
const svg = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="512" height="512">
<rect width="64" height="64" rx="${pad ? 0 : 14}" fill="#0f1115"/>
<path d="M18 33l9 9 19-20" fill="none" stroke="#34d399" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 })
for (const [name, size, maskable] of [['icon-512.png',512,false],['icon-192.png',192,false],['apple-touch-icon.png',180,false],['icon-512-maskable.png',512,true]]) {
  await p.setViewportSize({ width: size, height: size })
  await p.setContent(`<body style="margin:0;background:#0f1115">${svg(maskable).replace('width="512" height="512"', `width="${size}" height="${size}"`)}</body>`)
  writeFileSync(`public/${name}`, await p.screenshot({ omitBackground: false }))
}
await b.close()
console.log('icons ok')
