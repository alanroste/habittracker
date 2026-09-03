// Serves a per-user web app manifest so "Add to Home Screen" / "Install app"
// bakes the visitor's own /u/<token> link in as start_url, instead of the
// generic "/". Without this every installed icon opens "/" with no way to
// know which of the 8 users it belongs to — and on iOS, an installed
// home-screen app gets its own separate storage, so the token saved in
// localStorage while browsing in Safari isn't there on first cold launch.
// Requested via /app.webmanifest?u=<token> (see index.html + netlify.toml).
exports.handler = async (event) => {
  const token = (event.queryStringParameters && event.queryStringParameters.u) || ''
  const validToken = /^[a-z0-9]{16,64}$/i.test(token)

  const manifest = {
    name: '70 Days',
    short_name: '70 Days',
    description: 'Habit tracker for the crew. 70 days. No excuses (but log them anyway).',
    start_url: validToken ? `/u/${token}` : '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f1115',
    theme_color: '#0f1115',
    scope: '/',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(manifest),
  }
}
