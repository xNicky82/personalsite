// Deal ids we have already alerted on, so a HubSpot retry or a double-fired
// webhook does not send the same lead twice.
//
// Vercel KV and Upstash Redis speak the same REST protocol, so either set of
// environment variables works. The ordering rule that matters: check before
// sending, write only after a confirmed Slack 200. Writing before the send
// means a single Slack failure permanently suppresses that lead.

import { DEDUPE_TTL_SECONDS } from './config'

const PREFIX = 'oura-promo-alert:'

type RestConfig = { url: string; token: string }

function restConfig(): RestConfig | null {
  const url =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || ''
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || ''
  return url && token ? { url: url.replace(/\/$/, ''), token } : null
}

// Falls back to process memory when no store is configured. That is fine for
// local development and useless in production, where a lambda is cold most of
// the time, so the caller logs loudly when it happens.
const memory = new Map<string, number>()

export function isStoreConfigured(): boolean {
  return restConfig() !== null
}

async function command(cfg: RestConfig, args: string[]): Promise<unknown> {
  const res = await fetch(cfg.url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${cfg.token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(args),
    signal: AbortSignal.timeout(5000),
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(
      `dedupe store ${res.status}: ${await res.text().catch(() => '')}`,
    )
  }
  const json = (await res.json()) as { result?: unknown }
  return json.result
}

export async function alreadyAlerted(dealId: string): Promise<boolean> {
  const cfg = restConfig()
  const key = `${PREFIX}${dealId}`
  if (!cfg) {
    const expiry = memory.get(key)
    if (expiry === undefined) return false
    if (expiry < Date.now()) {
      memory.delete(key)
      return false
    }
    return true
  }
  return (await command(cfg, ['GET', key])) !== null
}

export async function markAlerted(dealId: string): Promise<void> {
  const cfg = restConfig()
  const key = `${PREFIX}${dealId}`
  if (!cfg) {
    memory.set(key, Date.now() + DEDUPE_TTL_SECONDS * 1000)
    return
  }
  await command(cfg, [
    'SET',
    key,
    String(Date.now()),
    'EX',
    String(DEDUPE_TTL_SECONDS),
  ])
}
