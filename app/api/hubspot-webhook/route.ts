// HubSpot webhook entry point for the Oura Ring Promo demo alerts.
//
// A webhook rather than a schedule. HubSpot posts within seconds of the deal
// being created, so there is no window for a backlog to accumulate in, which is
// the whole failure this replaces: a scheduled task that only ran while a
// laptop was open, then delivered the entire backlog at once. Vercel Cron would
// reintroduce it (a Hobby plan caps cron at once per day) and any polling design
// reintroduces it in a smaller way.
//
// The handler answers 200 as soon as the signature checks out and does the work
// in after(), because HubSpot retries on slow responses and a retry that
// overlaps the first attempt double-sends.

import { after, NextResponse } from 'next/server'
import { processDeal } from '@/lib/oura-alerts/pipeline'
import { isStoreConfigured } from '@/lib/oura-alerts/dedupe'
import { verifySignature } from '@/lib/oura-alerts/signature'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Grading with web search takes a few seconds per lead, and HubSpot batches
// events, so a burst after a campaign send can arrive as one large payload.
// Vercel clamps this to the plan ceiling (60s on Hobby); see the README for
// what to do when a batch outgrows it.
export const maxDuration = 300

// How many leads to grade at once. High enough to clear a batch, low enough to
// stay under the Anthropic and HubSpot rate limits during a campaign burst.
const CONCURRENCY = 4

type WebhookEvent = {
  objectId?: number | string
  subscriptionType?: string
  eventId?: number | string
}

function dealIdsFrom(payload: unknown): string[] {
  const events: WebhookEvent[] = Array.isArray(payload)
    ? (payload as WebhookEvent[])
    : [payload as WebhookEvent]

  const ids = events
    .filter((e) => e?.subscriptionType === 'deal.creation')
    .map((e) => (e.objectId === undefined ? '' : String(e.objectId)))
    .filter(Boolean)

  // HubSpot can repeat an object inside one payload.
  return [...new Set(ids)]
}

async function runAll(dealIds: string[]): Promise<void> {
  const queue = [...dealIds]

  const worker = async () => {
    for (;;) {
      const dealId = queue.shift()
      if (!dealId) return
      try {
        const outcome = await processDeal(dealId)
        if (outcome.status === 'failed') {
          console.error('[oura-alerts] failed', outcome.dealId, outcome.reason)
        } else if (outcome.status === 'sent') {
          console.log(
            '[oura-alerts] sent',
            outcome.dealId,
            outcome.delivered.join(','),
          )
        }
      } catch (err) {
        console.error('[oura-alerts] error on deal', dealId, err)
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker),
  )
}

export async function POST(request: Request) {
  const rawBody = await request.text()

  const check = verifySignature(request, rawBody)
  if (!check.ok) {
    console.warn('[oura-alerts] rejected webhook:', check.reason)
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const dealIds = dealIdsFrom(payload)

  if (!isStoreConfigured()) {
    // Process memory is not a dedupe store on a platform that runs a cold
    // lambda most of the time, so say so rather than quietly double-sending.
    console.warn(
      '[oura-alerts] no KV/Upstash credentials configured, dedupe is in-memory only',
    )
  }

  if (dealIds.length) after(() => runAll(dealIds))

  return NextResponse.json({ received: dealIds.length })
}
