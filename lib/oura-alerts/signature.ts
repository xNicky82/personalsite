// X-HubSpot-Signature-v3 verification.
//
// HubSpot signs the concatenation of method, full request URI, raw body and the
// request timestamp with the private app's client secret. The URI has to be
// byte-identical to what HubSpot called, which is why a deployment behind a
// rewrite can set HUBSPOT_WEBHOOK_URI to pin it.

import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from './config'

// HubSpot's own guidance: treat anything older than five minutes as a replay.
const MAX_SKEW_MS = 5 * 60 * 1000

export type SignatureCheck = { ok: true } | { ok: false; reason: string }

export function requestUri(request: Request): string {
  const override = env().webhookUriOverride
  if (override) return override

  const url = new URL(request.url)
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto')
  if (forwardedHost) url.host = forwardedHost
  if (forwardedProto) url.protocol = `${forwardedProto}:`
  return url.toString()
}

export function verifySignature(
  request: Request,
  rawBody: string,
  now = Date.now(),
): SignatureCheck {
  const secret = env().hubspotWebhookSecret
  if (!secret) return { ok: false, reason: 'HUBSPOT_WEBHOOK_SECRET is not set' }

  const signature = request.headers.get('x-hubspot-signature-v3')
  const timestamp = request.headers.get('x-hubspot-request-timestamp')
  if (!signature) return { ok: false, reason: 'missing signature header' }
  if (!timestamp) return { ok: false, reason: 'missing timestamp header' }

  const sentAt = Number(timestamp)
  if (!Number.isFinite(sentAt)) return { ok: false, reason: 'bad timestamp' }
  if (Math.abs(now - sentAt) > MAX_SKEW_MS) {
    return { ok: false, reason: 'timestamp outside the replay window' }
  }

  const expected = createHmac('sha256', secret)
    .update(
      `${request.method}${requestUri(request)}${rawBody}${timestamp}`,
      'utf8',
    )
    .digest('base64')

  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(signature, 'utf8')
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: 'signature mismatch' }
  }
  return { ok: true }
}
