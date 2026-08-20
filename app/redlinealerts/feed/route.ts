// JSON feed endpoint the client polls to keep the live feed fresh.
//
// The page server-renders an initial batch of alerts for a fast first paint;
// the client then polls this same-origin route every so often and merges in any
// genuinely new items by id. Keeping the fetch server-side (here) reuses the
// aggregator's edge cache and avoids the browser hitting news sites directly.

import { NextResponse } from 'next/server'
import { fetchAlerts } from '../alerts'

// Re-aggregate at most every 5 minutes (matches the per-feed fetch cache).
export const revalidate = 300

export async function GET() {
  const { alerts, source } = await fetchAlerts(Date.now())
  return NextResponse.json(
    { alerts, source },
    {
      headers: {
        // A minute in the browser, 5 at the edge — enough to feel live without
        // hammering the upstream feeds.
        'cache-control':
          'public, max-age=60, s-maxage=300, stale-while-revalidate=300',
      },
    },
  )
}
