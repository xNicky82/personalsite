import { createHmac } from 'node:crypto'
import { beforeEach, describe, expect, it } from 'vitest'
import { verifySignature } from '@/lib/oura-alerts/signature'

const SECRET = 'test-client-secret'
const URL_ = 'https://example.com/api/hubspot-webhook'
const BODY = '[{"subscriptionType":"deal.creation","objectId":1001}]'
const NOW = 1788530400000

function sign(timestamp: string, body = BODY, method = 'POST'): string {
  return createHmac('sha256', SECRET)
    .update(`${method}${URL_}${body}${timestamp}`, 'utf8')
    .digest('base64')
}

function request(headers: Record<string, string>): Request {
  return new Request(URL_, { method: 'POST', headers, body: BODY })
}

beforeEach(() => {
  process.env.HUBSPOT_WEBHOOK_SECRET = SECRET
  process.env.HUBSPOT_WEBHOOK_URI = URL_
})

describe('verifySignature', () => {
  it('accepts a correctly signed request', () => {
    const ts = String(NOW)
    const req = request({
      'x-hubspot-signature-v3': sign(ts),
      'x-hubspot-request-timestamp': ts,
    })
    expect(verifySignature(req, BODY, NOW)).toEqual({ ok: true })
  })

  it('rejects a tampered body', () => {
    const ts = String(NOW)
    const req = request({
      'x-hubspot-signature-v3': sign(ts),
      'x-hubspot-request-timestamp': ts,
    })
    const result = verifySignature(req, '[{"objectId":9999}]', NOW)
    expect(result).toMatchObject({ ok: false })
  })

  it('rejects a replay outside the five minute window', () => {
    const ts = String(NOW - 10 * 60 * 1000)
    const req = request({
      'x-hubspot-signature-v3': sign(ts),
      'x-hubspot-request-timestamp': ts,
    })
    expect(verifySignature(req, BODY, NOW)).toMatchObject({ ok: false })
  })

  it('rejects a request with no signature at all', () => {
    const req = request({ 'x-hubspot-request-timestamp': String(NOW) })
    expect(verifySignature(req, BODY, NOW)).toMatchObject({ ok: false })
  })

  it('refuses to verify when no secret is configured', () => {
    process.env.HUBSPOT_WEBHOOK_SECRET = ''
    const ts = String(NOW)
    const req = request({
      'x-hubspot-signature-v3': sign(ts),
      'x-hubspot-request-timestamp': ts,
    })
    expect(verifySignature(req, BODY, NOW)).toMatchObject({ ok: false })
  })
})
