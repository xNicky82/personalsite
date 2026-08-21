// Server-side legal-news aggregator for the Redline Alerts feed.
//
// This module is only ever imported by the server component in page.tsx and the
// route handler in feed/route.ts, so its network calls happen on the server
// (never in the browser), which also sidesteps the CORS walls news sites put
// up. It pulls recent law / contracts / regulatory headlines from a set of
// public RSS feeds (Google News topic searches), normalizes each item into a
// terse, "JUST IN"-style `Alert`, de-dupes, and sorts newest-first. If every
// source is unreachable it falls back to SAMPLE_ALERTS so the feed always
// renders — the same graceful-degradation pattern as /condos and /legaljobs.
//
// This is the seam where a Spellbook "Redline X" feed would later plug in:
// swap or add a source below and the UI is unchanged.

import {
  type Alert,
  type Source,
  buildSampleAlerts,
  classify,
  decodeEntities,
  hashId,
  looksLegal,
  toHeadline,
} from './data'
// Reuse the exact watchlist of major tech / AI companies that powers
// /legaljobs, so the two features stay in sync — add a company once and it's
// monitored here too.
import { COMPANY_BOARDS } from '../legaljobs/companies'

const TIMEOUT_MS = 9000
const REVALIDATE_S = 300 // re-fetch each feed at most every 5 minutes
const MAX_RESULTS = 80
const MAX_AGE_MS = 24 * 60 * 60 * 1000 // only surface alerts from the last 24h
const UA =
  'Mozilla/5.0 (compatible; RedlineAlertsBot/1.0; +https://nicholasrocha.com/redlinealerts)'

// Google News RSS topic searches, each scoped to legal / contract / regulatory
// news and to the last day or two so the feed stays "just in". `when:` limits
// recency; `hl`/`gl`/`ceid` pin it to US English.
const GN = 'https://news.google.com/rss/search'
const GN_TAIL = '&hl=en-US&gl=US&ceid=US:en'
// `trust: true` marks a feed whose search query is already tightly scoped to a
// legal / legal-tech topic (hiring, product launches, lateral moves). Those
// items are kept even when a headline doesn't literally contain a legal
// keyword — the query has already done the topic filtering — so genuinely
// broader, non-mainstream signals aren't dropped by `looksLegal`.
const FEEDS: { url: string; source: string; trust?: boolean }[] = [
  {
    url: `${GN}?q=${encodeURIComponent('(contract OR "breach of contract" OR merger OR acquisition) law when:2d')}${GN_TAIL}`,
    source: 'Google News',
  },
  // Contract-centric wires — the signal that aligns most closely with the
  // Spellbook business, so it gets several dedicated, trusted queries covering
  // disputes, deal structures, and specific clause types.
  {
    url: `${GN}?q=${encodeURIComponent('"breach of contract" OR "contract dispute" OR "contract lawsuit" OR "contract termination" when:2d')}${GN_TAIL}`,
    source: 'Google News',
    trust: true,
  },
  {
    url: `${GN}?q=${encodeURIComponent('"master services agreement" OR "supply agreement" OR "licensing agreement" OR "procurement contract" OR "vendor agreement" when:2d')}${GN_TAIL}`,
    source: 'Google News',
    trust: true,
  },
  {
    url: `${GN}?q=${encodeURIComponent('contract (clause OR indemnity OR "force majeure" OR "non-compete" OR exclusivity OR renewal OR renegotiated) when:2d')}${GN_TAIL}`,
    source: 'Google News',
    trust: true,
  },
  {
    url: `${GN}?q=${encodeURIComponent('(lawsuit OR "class action" OR antitrust OR litigation) company when:2d')}${GN_TAIL}`,
    source: 'Google News',
  },
  {
    url: `${GN}?q=${encodeURIComponent('(SEC OR FTC OR DOJ OR regulator) (charges OR fine OR settlement OR rule) when:2d')}${GN_TAIL}`,
    source: 'Google News',
  },
  {
    url: `${GN}?q=${encodeURIComponent('("Supreme Court" OR "appeals court") ruling when:2d')}${GN_TAIL}`,
    source: 'Google News',
  },
  {
    url: `${GN}?q=${encodeURIComponent('("legal tech" OR "contract AI" OR "legal AI" OR compliance software) when:7d')}${GN_TAIL}`,
    source: 'Google News',
  },
  // Broader, less-mainstream legal signals below — new hires / lateral moves,
  // product launches & funding, and open legal roles. Each query is already
  // legal-scoped, so these feeds are trusted past the keyword filter.
  {
    url: `${GN}?q=${encodeURIComponent('("law firm" OR "general counsel" OR "chief legal officer") (hires OR names OR appoints OR joins OR "lateral" OR "new partner") when:7d')}${GN_TAIL}`,
    source: 'Google News',
    trust: true,
  },
  {
    url: `${GN}?q=${encodeURIComponent('("legal tech" OR "contract AI" OR "legal AI" OR CLM OR "contract management") (launches OR unveils OR "rolls out" OR debuts OR raises OR "new product") when:7d')}${GN_TAIL}`,
    source: 'Google News',
    trust: true,
  },
  {
    url: `${GN}?q=${encodeURIComponent('("general counsel" OR "legal counsel" OR paralegal OR "compliance officer" OR "legal operations") (hiring OR "job opening" OR "now hiring" OR "open role") when:7d')}${GN_TAIL}`,
    source: 'Google News',
    trust: true,
  },
]

// --- Company watchlist ------------------------------------------------------
// Monitor each major tech / AI company from the shared COMPANY_BOARDS list for
// *legally relevant* news only: contracts, SEC filings, M&A, litigation,
// antitrust, enforcement, IP. Company names are OR'd into batches (to stay
// within a sane number of requests) and ANDed with this legal clause so we get
// "Anthropic + lawsuit", never "Anthropic launches a new model". These feeds
// are NOT trusted, so `looksLegal` still runs as a second gate — keeping noise
// from generic company names (e.g. "Ro", "Notion") out of the wire.
const WATCH_CLAUSE =
  '(lawsuit OR antitrust OR settlement OR "SEC filing" OR "10-K" OR "8-K" OR IPO OR acquisition OR merger OR acquires OR contract OR "breach of contract" OR regulator OR probe OR fine OR patent OR copyright OR subpoena)'
const WATCH_BATCH = 10 // companies per query

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

const WATCHLIST_FEEDS: { url: string; source: string; trust?: boolean }[] =
  chunk(COMPANY_BOARDS, WATCH_BATCH).map((group) => {
    const names = group.map((c) => `"${c.name}"`).join(' OR ')
    return {
      url: `${GN}?q=${encodeURIComponent(`(${names}) ${WATCH_CLAUSE} when:2d`)}${GN_TAIL}`,
      source: 'Google News',
    }
  })

// Every source the aggregator scans: the curated topic feeds plus the
// per-company watchlist feeds.
const ALL_FEEDS = [...FEEDS, ...WATCHLIST_FEEDS]

// Pull the first capture group of a regex out of an RSS <item> block.
function pick(block: string, re: RegExp): string {
  const m = block.match(re)
  return m ? m[1].trim() : ''
}

// A CDATA-or-plain field extractor: RSS wraps some fields in <![CDATA[…]]>.
function field(block: string, tag: string): string {
  const re = new RegExp(
    `<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`,
    'i',
  )
  return pick(block, re)
}

// Parse an RSS document into raw {title, link, pubDate, source} items using
// regex only — no XML-parser dependency, matching the site's existing
// regex-based text handling. Resilient to the minor shape differences between
// feeds (missing pubDate, source attribution baked into the title, etc.).
function parseRss(
  xml: string,
): { title: string; link: string; pubDate: string; source: string }[] {
  const items: {
    title: string
    link: string
    pubDate: string
    source: string
  }[] = []
  const blocks = xml.split(/<item[\s>]/i).slice(1)
  for (const raw of blocks) {
    const block = raw.slice(0, raw.search(/<\/item>/i))
    const title = field(block, 'title')
    let link = field(block, 'link')
    // Some feeds put the URL in an href attribute rather than element text.
    if (!link) link = pick(block, /<link[^>]*href=["']([^"']+)["']/i)
    const pubDate = field(block, 'pubDate')
    // Google News encodes the publisher as <source url="…">Name</source>.
    const source = pick(block, /<source[^>]*>([\s\S]*?)<\/source>/i)
    if (title && link) {
      items.push({
        title,
        link: decodeEntities(link),
        pubDate,
        source: decodeEntities(source),
      })
    }
  }
  return items
}

async function getText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { accept: 'application/rss+xml, application/xml', 'user-agent': UA },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: REVALIDATE_S },
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

function toIso(pubDate: string): string | null {
  const t = Date.parse(pubDate)
  return Number.isFinite(t) ? new Date(t).toISOString() : null
}

// Fetch every feed, normalize, keep only on-topic items, de-dupe by headline,
// and return newest-first. `anchorMs` is the reference "now" used only to fill
// a timestamp when a feed omits pubDate (kept out of module scope so nothing
// calls Date.now() implicitly during a render).
export async function fetchAlerts(
  anchorMs: number,
): Promise<{ alerts: Alert[]; source: Source }> {
  const docs = await Promise.all(ALL_FEEDS.map((f) => getText(f.url)))

  const byId = new Map<string, Alert>()
  docs.forEach((xml, i) => {
    if (!xml) return
    for (const item of parseRss(xml)) {
      const headline = toHeadline(item.title)
      if (headline.length < 12) continue
      // Trusted feeds are already topic-scoped by their query; only the broad
      // news wires get the extra legal-keyword gate.
      if (!ALL_FEEDS[i].trust && !looksLegal(`${item.title} ${headline}`))
        continue
      const id = hashId(headline.toLowerCase())
      if (byId.has(id)) continue
      byId.set(id, {
        id,
        headline,
        category: classify(headline),
        source: item.source || ALL_FEEDS[i].source,
        url: item.link,
        publishedAt: toIso(item.pubDate) ?? new Date(anchorMs).toISOString(),
      })
    }
  })

  const cutoff = anchorMs - MAX_AGE_MS
  const alerts = Array.from(byId.values())
    .filter((a) => Date.parse(a.publishedAt) >= cutoff)
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, MAX_RESULTS)

  // Nothing reachable (local dev behind the proxy, or every feed down) →
  // fall back to the curated sample wire so the demo always looks alive.
  if (alerts.length < 6) {
    return { alerts: buildSampleAlerts(anchorMs), source: 'sample' }
  }
  return { alerts, source: 'live' }
}
