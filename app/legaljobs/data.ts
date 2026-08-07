// Data model for the Legal Jobs aggregator at /legaljobs.
//
// A `Job` is the normalized shape every source is mapped into, so the UI never
// has to know which board a posting came from. Live postings are fetched
// server-side in `jobs.ts`; when every source is unreachable (e.g. in local dev
// behind a restrictive proxy) the page falls back to SAMPLE_JOBS so it always
// renders something useful — the same live-or-sample pattern used by /condos.

export type Job = {
  id: string // stable id, unique across sources
  title: string
  company: string
  description: string // plain text, already stripped of HTML and truncated
  salary: string | null // human-readable, e.g. "$120k – $150k" — null if unknown
  location: string | null // e.g. "Remote (US)" — null if unspecified
  type: string | null // e.g. "Full-time" — null if unspecified
  tags: string[] // a few skill/keyword tags, at most a handful
  url: string // link back to the original posting
  source: string // which board it came from, e.g. "Remotive"
  postedAt: string | null // ISO date string, or null
}

// Words that mark a posting as legal work. Used to keep general job boards on
// topic when a source doesn't expose a clean "legal" category.
export const LEGAL_KEYWORDS = [
  'legal',
  'lawyer',
  'attorney',
  'counsel',
  'paralegal',
  'litigation',
  'compliance',
  'contract',
  'general counsel',
  'privacy',
  'regulatory',
  'law ',
]

export function looksLegal(text: string): boolean {
  const t = text.toLowerCase()
  return LEGAL_KEYWORDS.some((k) => t.includes(k))
}

// Collapse HTML/markup to a short single-line plain-text blurb.
export function toBlurb(html: string, max = 200): string {
  const text = html
    .replace(/<[^>]*>/g, ' ') // strip tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&rsquo;|&#8217;/g, '’')
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= max) return text
  return text.slice(0, max).replace(/\s+\S*$/, '') + '…'
}

// Format a role's type token ("full_time", "contract") into a clean label.
export function prettyType(raw: string | null | undefined): string | null {
  const s = (raw ?? '').replace(/[_-]+/g, ' ').trim()
  if (!s) return null
  return s
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('-')
    .replace('Full-time', 'Full-time')
}

// A curated set of representative legal roles used only when no live source is
// reachable. Each links to a real, stable careers page rather than a specific
// posting, and the UI clearly flags the list as sample data in that case.
export const SAMPLE_JOBS: Job[] = [
  {
    id: 'sample-coinbase-counsel',
    title: 'Corporate Counsel, Commercial',
    company: 'Coinbase',
    description:
      'Draft and negotiate commercial agreements across vendor, partnership, and SaaS deals for a fully-remote legal team supporting a public crypto company.',
    salary: '$180k – $210k',
    location: 'Remote (US)',
    type: 'Full-time',
    tags: ['Commercial', 'Contracts', 'Corporate'],
    url: 'https://www.coinbase.com/careers/positions',
    source: 'Sample',
    postedAt: null,
  },
  {
    id: 'sample-gitlab-counsel',
    title: 'Senior Legal Counsel, Commercial',
    company: 'GitLab',
    description:
      'Structure and negotiate enterprise software agreements and advise go-to-market teams at an all-remote company. Manage contract review workflows end to end.',
    salary: '$155k – $200k',
    location: 'Remote (Global)',
    type: 'Full-time',
    tags: ['SaaS', 'Commercial', 'Enterprise'],
    url: 'https://about.gitlab.com/jobs/',
    source: 'Sample',
    postedAt: null,
  },
  {
    id: 'sample-automattic-counsel',
    title: 'Legal Counsel',
    company: 'Automattic',
    description:
      'Support product, privacy, and commercial matters for WordPress.com and WooCommerce across a distributed team spanning dozens of countries.',
    salary: null,
    location: 'Remote (Global)',
    type: 'Full-time',
    tags: ['Privacy', 'Product', 'Commercial'],
    url: 'https://automattic.com/work-with-us/',
    source: 'Sample',
    postedAt: null,
  },
  {
    id: 'sample-shopify-counsel',
    title: 'Commercial Counsel',
    company: 'Shopify',
    description:
      'Partner with sales and partnerships to draft, negotiate, and close commercial deals while scaling contracting playbooks for a global merchant platform.',
    salary: null,
    location: 'Remote (North America)',
    type: 'Full-time',
    tags: ['Commercial', 'Sales', 'Contracts'],
    url: 'https://www.shopify.com/careers',
    source: 'Sample',
    postedAt: null,
  },
  {
    id: 'sample-stripe-counsel',
    title: 'Counsel, Regulatory',
    company: 'Stripe',
    description:
      'Advise on financial-services and payments regulation across markets, and help build compliant products with engineering and policy partners.',
    salary: '$190k – $240k',
    location: 'Remote (US)',
    type: 'Full-time',
    tags: ['Regulatory', 'Payments', 'Compliance'],
    url: 'https://stripe.com/jobs/search',
    source: 'Sample',
    postedAt: null,
  },
  {
    id: 'sample-doordash-paralegal',
    title: 'Senior Paralegal, Commercial',
    company: 'DoorDash',
    description:
      'Manage contract intake, template maintenance, and the commercial signature process, supporting attorneys across a high-volume in-house legal team.',
    salary: '$95k – $125k',
    location: 'Remote (US)',
    type: 'Full-time',
    tags: ['Paralegal', 'Contracts', 'Operations'],
    url: 'https://careers.doordash.com/',
    source: 'Sample',
    postedAt: null,
  },
  {
    id: 'sample-reddit-privacy',
    title: 'Privacy Counsel',
    company: 'Reddit',
    description:
      'Advise on global privacy compliance, data governance, and product launches, working closely with security and engineering on a remote-first team.',
    salary: '$165k – $215k',
    location: 'Remote (US)',
    type: 'Full-time',
    tags: ['Privacy', 'Data', 'Product'],
    url: 'https://www.redditinc.com/careers',
    source: 'Sample',
    postedAt: null,
  },
  {
    id: 'sample-elastic-litigation',
    title: 'Litigation & Employment Counsel',
    company: 'Elastic',
    description:
      'Own employment matters and manage litigation and pre-litigation disputes for a distributed, publicly-traded software company.',
    salary: null,
    location: 'Remote (US)',
    type: 'Full-time',
    tags: ['Litigation', 'Employment'],
    url: 'https://www.elastic.co/careers/',
    source: 'Sample',
    postedAt: null,
  },
]
