// Server-side logo proxy for the /legaljobs company cards.
//
// The browser used to hit Clearbit / favicon CDNs directly, which was slow and
// flaky (cross-origin, cold caches, referrer rules). Instead the client now
// requests a single same-origin URL — /legaljobs/logo?domain=stripe.com — and
// this handler fetches the logo on the server, caching it at the edge so every
// later request is instant. It tries a few providers and always returns *an*
// image (falling back to an initials SVG) so the card never shows a broken tile.

const UA =
  'Mozilla/5.0 (compatible; LegalJobsBot/1.0; +https://nicholasrocha.com/legaljobs)'
const UPSTREAM_TIMEOUT_MS = 6000
const UPSTREAM_REVALIDATE_S = 60 * 60 * 24 * 30 // cache each logo for 30 days
// Cache the response we serve: a day in the browser, a month at the CDN edge.
const CACHE_CONTROL = 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400'

function providersFor(domain: string): string[] {
  return [
    `https://logo.clearbit.com/${domain}?size=128`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  ]
}

function initials(s: string): string {
  const parts = s.trim().split(/[\s.-]+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// A neutral, theme-agnostic initials tile (transparent bg + mid-grey text, so it
// reads on both light and dark cards).
function initialsSvg(label: string): Response {
  const text = initials(label)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="34" font-weight="600" fill="#71717a">${text}</text></svg>`
  return new Response(svg, {
    headers: { 'content-type': 'image/svg+xml; charset=utf-8', 'cache-control': CACHE_CONTROL },
  })
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const domainRaw = (searchParams.get('domain') ?? '').toLowerCase().trim()
  const name = searchParams.get('name') ?? ''

  // Only ever interpolate a clean domain into the fixed provider URLs — never
  // fetch an arbitrary host (no SSRF).
  const domain = /^[a-z0-9.-]+\.[a-z]{2,}$/.test(domainRaw) ? domainRaw : ''
  if (!domain) return initialsSvg(name || domainRaw)

  for (const url of providersFor(domain)) {
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': UA, accept: 'image/*' },
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        next: { revalidate: UPSTREAM_REVALIDATE_S },
      })
      if (!res.ok) continue
      const type = res.headers.get('content-type') ?? ''
      if (!type.startsWith('image/')) continue
      const buf = await res.arrayBuffer()
      if (buf.byteLength < 100) continue // skip empty / 1x1 tracker pixels
      return new Response(buf, {
        headers: { 'content-type': type, 'cache-control': CACHE_CONTROL },
      })
    } catch {
      // timeout / network error — try the next provider
    }
  }

  return initialsSvg(name || domain)
}
