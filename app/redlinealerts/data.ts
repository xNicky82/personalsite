// Data model + presentation helpers for the Redline Alerts live feed at
// /redlinealerts.
//
// An `Alert` is the normalized shape every news source is mapped into, so the
// UI never has to know which wire an item came from. Alerts are aggregated
// server-side in `alerts.ts`; when every source is unreachable (e.g. in local
// dev behind a restrictive proxy) the feed falls back to SAMPLE_ALERTS so it
// always renders something useful — the same live-or-sample pattern used by
// /condos and /legaljobs.
//
// This is a demo. Today it scans public legal / contract / regulatory news; the
// `source` field and the aggregator in `alerts.ts` are the seam where a
// Spellbook "Redline X" feed would later plug in, keeping the UI unchanged.

export type AlertCategory =
  | 'Litigation'
  | 'Regulation'
  | 'Enforcement'
  | 'M&A'
  | 'Contracts'
  | 'Ruling'
  | 'Policy'
  | 'Legal Tech'
  | 'Hiring' // new job postings / open legal roles
  | 'People' // lateral moves, new hires, GC/CLO appointments
  | 'Launch' // product announcements, feature launches, funding

export type Alert = {
  id: string // stable id, unique across sources (hash of the headline)
  headline: string // short, terse, "JUST IN"-style — already cleaned
  category: AlertCategory
  source: string // which wire it came from, e.g. "Reuters Legal"
  url: string // link back to the original story
  publishedAt: string // ISO timestamp
}

export type Source = 'live' | 'sample'

// The accent used across Spellbook surfaces (Spellbook orange). Centralized so
// the whole feed's accent — or a rebrand — changes from one place.
export const ACCENT = '#FF4716'

// Per-category colors, kept muted so a wall of them still reads as one feed.
// [textLight, bgLight, textDark, bgDark] — Tailwind-free so the client can
// inline them as CSS custom properties without a config round-trip.
export const CATEGORY_STYLE: Record<
  AlertCategory,
  { dot: string; label: string }
> = {
  Litigation: { dot: '#ef4444', label: 'Litigation' },
  Regulation: { dot: '#3b82f6', label: 'Regulation' },
  Enforcement: { dot: '#f97316', label: 'Enforcement' },
  'M&A': { dot: '#a855f7', label: 'M&A' },
  Contracts: { dot: '#14b8a6', label: 'Contracts' },
  Ruling: { dot: '#eab308', label: 'Ruling' },
  Policy: { dot: '#6366f1', label: 'Policy' },
  'Legal Tech': { dot: '#ec4899', label: 'Legal Tech' },
  Hiring: { dot: '#22c55e', label: 'Hiring' },
  People: { dot: '#0ea5e9', label: 'People' },
  Launch: { dot: '#f59e0b', label: 'Launch' },
}

export const CATEGORIES = Object.keys(CATEGORY_STYLE) as AlertCategory[]

// Keyword → category rules, checked in order against a lowercased headline.
// First match wins; falls back to 'Policy' (the broadest bucket).
const CATEGORY_RULES: { category: AlertCategory; kw: string[] }[] = [
  {
    category: 'Ruling',
    kw: [
      'supreme court',
      'appeals court',
      'judge rules',
      'court rules',
      'ruling',
      'verdict',
      'jury',
      'overturn',
      'upholds',
      'strikes down',
    ],
  },
  {
    category: 'Enforcement',
    kw: [
      'sec charges',
      'doj',
      'ftc',
      'fined',
      'fine',
      'penalty',
      'settlement',
      'settle',
      'charges',
      'indict',
      'probe',
      'investigation',
      'subpoena',
    ],
  },
  {
    category: 'Litigation',
    kw: [
      'lawsuit',
      'sues',
      'sued',
      'class action',
      'litigation',
      'files suit',
      'complaint',
      'damages',
      'antitrust suit',
    ],
  },
  {
    category: 'M&A',
    kw: [
      'acquire',
      'acquisition',
      'merger',
      'merge',
      'buyout',
      'takeover',
      'deal',
      'to buy',
      'stake in',
    ],
  },
  {
    category: 'People',
    kw: [
      'joins as',
      'joins ',
      'hires',
      'names',
      'appoints',
      'appointed',
      'elevates',
      'promoted to',
      'lateral',
      'new partner',
      'new general counsel',
      'chief legal officer',
      'general counsel',
      'steps down',
      'departs',
      'to lead',
    ],
  },
  {
    category: 'Hiring',
    kw: [
      'is hiring',
      'now hiring',
      'job opening',
      'open role',
      'open position',
      'job posting',
      'hiring for',
      'seeking a',
      'careers',
    ],
  },
  {
    category: 'Launch',
    kw: [
      'launches',
      'unveils',
      'rolls out',
      'debuts',
      'introduces',
      'new product',
      'new feature',
      'now available',
      'general availability',
      'raises $',
      'raises €',
      'series a',
      'series b',
      'series c',
      'seed round',
      'funding round',
    ],
  },
  {
    category: 'Contracts',
    kw: [
      'contract',
      'agreement',
      'breach',
      'terms of service',
      'licensing',
      'renegotiat',
      'signs deal',
      'procurement',
      'nda',
    ],
  },
  {
    category: 'Legal Tech',
    kw: [
      'legal tech',
      'legaltech',
      'ai contract',
      'contract ai',
      'spellbook',
      'harvey',
      'ediscovery',
      'clm',
      'ai lawyer',
      'legal ai',
    ],
  },
  {
    category: 'Regulation',
    kw: [
      'regulat',
      'compliance',
      'gdpr',
      'privacy',
      'data protection',
      'antitrust',
      'bill',
      'act',
      'rule',
      'mandate',
      'ban',
    ],
  },
]

export function classify(headline: string): AlertCategory {
  const t = headline.toLowerCase()
  for (const { category, kw } of CATEGORY_RULES) {
    if (kw.some((k) => t.includes(k))) return category
  }
  return 'Policy'
}

// Words that mark a story as on-topic for a legal / contracts / regulatory
// feed. Used to keep broad news wires from leaking unrelated headlines in.
export const LEGAL_TERMS = [
  'law',
  'legal',
  'lawsuit',
  'court',
  'judge',
  'attorney',
  'counsel',
  'litigation',
  'contract',
  'regulat',
  'compliance',
  'antitrust',
  'settlement',
  'sec ',
  'ftc',
  'doj',
  'privacy',
  'gdpr',
  'merger',
  'acquisition',
  'ruling',
  'appeal',
  'patent',
  'copyright',
  'liability',
  'general counsel',
  'paralegal',
  'law firm',
  'legaltech',
  'legal tech',
  'legal ai',
  'clm',
]

export function looksLegal(text: string): boolean {
  const t = ` ${text.toLowerCase()} `
  return LEGAL_TERMS.some((k) => t.includes(k))
}

// A small, stable string hash → base36. Used to derive a deterministic id from
// a headline so the same story keeps the same id across refetches (and so the
// client can dedupe live items against what it already has).
export function hashId(input: string): string {
  let h = 5381
  for (let i = 0; i < input.length; i++) {
    h = (h * 33) ^ input.charCodeAt(i)
  }
  return 'a' + (h >>> 0).toString(36)
}

// Named HTML entities we expect to see in news-wire titles.
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  ldquo: '“',
  rdquo: '”',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  '#39': "'",
}

export function decodeEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-fA-F]+|\w+);/g, (m, e: string) => {
    if (e[0] === '#') {
      const code =
        e[1] === 'x' || e[1] === 'X'
          ? parseInt(e.slice(2), 16)
          : parseInt(e.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : m
    }
    return NAMED_ENTITIES[e] ?? m
  })
}

// Turn a raw RSS <title> into a terse, "JUST IN"-style headline: decode
// entities, strip any trailing " - Source" attribution that news aggregators
// append, drop a trailing period, and cap the length so every card is one or
// two lines.
export function toHeadline(rawTitle: string, max = 140): string {
  let s = decodeEntities(rawTitle).replace(/\s+/g, ' ').trim()
  // Aggregators append " - Publisher"; remove the last such segment.
  s = s.replace(/\s+[-–—]\s+[^-–—]{2,40}$/, '')
  s = s.replace(/\.$/, '')
  if (s.length > max) s = s.slice(0, max).replace(/\s+\S*$/, '') + '…'
  return s
}

// Compact, Polymarket-style relative time: "now", "34s", "12m", "3h", "2d".
// Pass the current time in so callers control the clock (the client ticks it;
// the server never calls this in a render path, avoiding hydration drift).
export function timeAgo(iso: string, now: number): string {
  const then = Date.parse(iso)
  if (!Number.isFinite(then)) return ''
  const s = Math.max(0, Math.floor((now - then) / 1000))
  if (s < 5) return 'now'
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  return `${d}d`
}

// Build the sample fallback pool. Timestamps are derived from a fixed anchor
// passed in by the caller (never Date.now() at module scope), spread back over
// the last few hours so the feed looks like a live wire mid-burst. Each links
// to a real, stable page rather than a fabricated article URL.
export function buildSampleAlerts(anchorMs: number): Alert[] {
  const MIN = 60 * 1000
  // [minutesAgo, headline, source, url]
  const seed: [number, string, string, string][] = [
    [
      1,
      'FTC opens antitrust probe into AI cloud-compute partnerships',
      'Reuters Legal',
      'https://www.reuters.com/legal/',
    ],
    [
      2,
      'Spellbook launches Redline X clause-risk scoring for enterprise contracts',
      'Legaltech News',
      'https://legaltechnews.com/',
    ],
    [
      3,
      'Kirkland & Ellis names new global head of M&A',
      'Above the Law',
      'https://abovethelaw.com/',
    ],
    [
      4,
      'Supreme Court agrees to hear landmark data-privacy case next term',
      'SCOTUSblog',
      'https://www.scotusblog.com/',
    ],
    [
      7,
      'SEC charges fintech unicorn over misleading investor disclosures',
      'SEC Newsroom',
      'https://www.sec.gov/news/pressreleases',
    ],
    [
      9,
      'Stripe is hiring a Commercial Counsel for its payments team',
      'Stripe Careers',
      'https://stripe.com/jobs/search',
    ],
    [
      11,
      'Two chipmakers sign $12B supply agreement with 5-year exclusivity clause',
      'Bloomberg Law',
      'https://news.bloomberglaw.com/',
    ],
    [
      15,
      'Ninth Circuit revives class action over app store contract terms',
      'Law360',
      'https://www.law360.com/',
    ],
    [
      16,
      'Harvey raises $100M Series C to expand its legal AI platform',
      'TechCrunch',
      'https://techcrunch.com/',
    ],
    [
      19,
      'EU finalizes AI Act guidance on high-risk contract-automation systems',
      'Politico',
      'https://www.politico.eu/',
    ],
    [
      24,
      'Streaming giant sued for breach of talent-licensing agreements',
      'The Hollywood Reporter',
      'https://www.hollywoodreporter.com/',
    ],
    [
      26,
      'DoorDash is hiring a senior commercial paralegal for its legal team',
      'DoorDash Careers',
      'https://careers.doordash.com/',
    ],
    [
      29,
      'DOJ moves to block $8B healthcare merger on antitrust grounds',
      'Reuters Legal',
      'https://www.reuters.com/legal/',
    ],
    [
      34,
      'State AG coalition subpoenas social platform over youth-safety compliance',
      'Politico',
      'https://www.politico.com/',
    ],
    [
      41,
      'Spellbook expands Redline X to auto-flag risky indemnity clauses',
      'Legaltech News',
      'https://legaltechnews.com/',
    ],
    [
      44,
      'Latham & Watkins hires antitrust partner away from a rival firm',
      'Reuters Legal',
      'https://www.reuters.com/legal/',
    ],
    [
      46,
      'Ironclad unveils AI redlining for high-volume procurement contracts',
      'Legaltech News',
      'https://legaltechnews.com/',
    ],
    [
      48,
      'Court upholds enforceability of clickwrap arbitration provision',
      'Bloomberg Law',
      'https://news.bloomberglaw.com/',
    ],
    [
      55,
      'Automaker settles emissions suit for $1.4B, admits no wrongdoing',
      'Reuters Legal',
      'https://www.reuters.com/legal/',
    ],
    [
      63,
      'GDPR regulator fines ad-tech firm €90M over consent contracts',
      'Politico',
      'https://www.politico.eu/',
    ],
    [
      72,
      'Private-equity firm to acquire legal-services provider in $2.1B deal',
      'Bloomberg Law',
      'https://news.bloomberglaw.com/',
    ],
    [
      78,
      'Coinbase appoints a new Chief Legal Officer',
      'Bloomberg Law',
      'https://news.bloomberglaw.com/',
    ],
    [
      84,
      'Federal judge blocks noncompete clause under new FTC rule',
      'Law360',
      'https://www.law360.com/',
    ],
    [
      96,
      'Publisher files copyright suit over AI-training data licensing',
      'Reuters Legal',
      'https://www.reuters.com/legal/',
    ],
    [
      110,
      'Two banks renegotiate loan covenants amid rate uncertainty',
      'Bloomberg Law',
      'https://news.bloomberglaw.com/',
    ],
    [
      126,
      'Appeals court narrows scope of software patent in landmark ruling',
      'Law360',
      'https://www.law360.com/',
    ],
    [
      132,
      'Shopify posts a job opening for Commercial Counsel, North America',
      'Shopify Careers',
      'https://www.shopify.com/careers',
    ],
    [
      145,
      'Regulator proposes new disclosure rules for SaaS data-processing terms',
      'The Verge',
      'https://www.theverge.com/',
    ],
    [
      168,
      'Aerospace supplier sued over breach of long-term procurement contract',
      'Reuters Legal',
      'https://www.reuters.com/legal/',
    ],
    [
      190,
      'City settles civil-rights class action, agrees to compliance monitor',
      'AP News',
      'https://apnews.com/',
    ],
    [
      215,
      'Crypto exchange reaches settlement with regulator over custody terms',
      'Bloomberg Law',
      'https://news.bloomberglaw.com/',
    ],
    [
      240,
      'Retailer wins dismissal of vendor contract-interference claim',
      'Law360',
      'https://www.law360.com/',
    ],
    [
      270,
      'Legal-AI startup raises $47M to automate contract redlining',
      'TechCrunch',
      'https://techcrunch.com/',
    ],
    [
      300,
      'Energy firms sign carbon-credit agreement with clawback provisions',
      'Reuters Legal',
      'https://www.reuters.com/legal/',
    ],
    [
      330,
      'Supreme Court declines to review lower-court antitrust ruling',
      'SCOTUSblog',
      'https://www.scotusblog.com/',
    ],
    [
      360,
      'Hospital system sued over surprise-billing contract disclosures',
      'AP News',
      'https://apnews.com/',
    ],
    [
      400,
      'Software vendor fined for GDPR violations in EU data contracts',
      'Politico',
      'https://www.politico.eu/',
    ],
    [
      440,
      'Studios and writers guild finalize licensing terms for AI use',
      'The Hollywood Reporter',
      'https://www.hollywoodreporter.com/',
    ],
    [
      480,
      'Telecom giant challenges state privacy law as unconstitutional',
      'Reuters Legal',
      'https://www.reuters.com/legal/',
    ],
    [
      520,
      'Startup accused of breaching exclusivity clause in distribution deal',
      'Bloomberg Law',
      'https://news.bloomberglaw.com/',
    ],
    [
      560,
      'FTC finalizes rule requiring plain-language subscription contracts',
      'The Verge',
      'https://www.theverge.com/',
    ],
  ]

  return seed.map(([minsAgo, headline, source, url]) => ({
    id: hashId(headline),
    headline,
    category: classify(headline),
    source,
    url,
    publishedAt: new Date(anchorMs - minsAgo * MIN).toISOString(),
  }))
}
