// Server-side legal-jobs aggregator.
//
// This module is only ever imported by the server component in page.tsx, so its
// network calls happen on the server (at build / revalidate time), never in the
// browser — which also sidesteps the CORS walls these boards put up. It pulls
// from several public job boards, normalizes every posting into the shared
// `Job` shape, de-dupes, sorts newest-first, and returns a `source` flag. If
// every board is unreachable it falls back to SAMPLE_JOBS so the page always
// renders — the same graceful-degradation pattern as /condos.
//
// Sources:
//   • Remotive   — remote board with a first-class "legal" category   (no key)
//   • Jobicy     — remote board, filtered to legal roles              (no key)
//   • The Muse   — general board with a real "Legal" category, incl.
//                  on-site roles — the biggest breadth win            (no key)
//   • Arbeitnow  — general board, title-filtered to legal roles       (no key)
//   • RemoteOK   — general remote board, title-filtered to legal      (no key)
//   • Adzuna     — huge aggregator w/ salaries, "legal-jobs" category (env keys)
//   • USAJOBS    — U.S. federal attorney/legal postings               (env keys)
//
// Keyed sources are skipped silently when their env vars are absent, so the
// board works out of the box and simply gets richer once keys are provided.

import {
  type Job,
  SAMPLE_JOBS,
  decodeEntities,
  prettyType,
  titleLooksLegal,
  toBlurb,
} from './data'

const TIMEOUT_MS = 9000
const REVALIDATE_S = 3600 // re-fetch each source at most hourly
const MAX_RESULTS = 400 // safety cap on the merged, de-duped list
const UA =
  'Mozilla/5.0 (compatible; LegalJobsBot/1.0; +https://nicholasrocha.com/legaljobs)'

type Raw = Record<string, unknown>

function str(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v).trim()
}
function text(v: unknown): string {
  return decodeEntities(str(v))
}
function num(v: unknown): number {
  const n =
    typeof v === 'number' ? v : parseFloat(str(v).replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) ? n : 0
}
function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}
function asRecord(v: unknown): Raw {
  return v && typeof v === 'object' ? (v as Raw) : {}
}

async function getJson(
  url: string,
  headers: Record<string, string> = {},
): Promise<Raw | unknown[] | null> {
  try {
    const res = await fetch(url, {
      headers: { accept: 'application/json', 'user-agent': UA, ...headers },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: REVALIDATE_S },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// Compact a currency amount to "$120k" style; leaves small/odd values alone.
function shortMoney(n: number, currency: string): string {
  const sym =
    currency === 'USD' || currency === '' ? '$' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : `${currency} `
  if (n >= 1000) return `${sym}${Math.round(n / 1000)}k`
  return `${sym}${Math.round(n)}`
}

function salaryRange(
  min: number,
  max: number,
  currency = 'USD',
): string | null {
  if (min > 0 && max > 0 && max >= min)
    return `${shortMoney(min, currency)} – ${shortMoney(max, currency)}`
  if (max > 0) return `Up to ${shortMoney(max, currency)}`
  if (min > 0) return `From ${shortMoney(min, currency)}`
  return null
}

function isoFromUnix(v: unknown): string | null {
  const n = num(v)
  if (!n) return null
  const ms = n < 1e12 ? n * 1000 : n // seconds vs milliseconds
  const d = new Date(ms)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function isoFromString(v: unknown): string | null {
  const s = str(v)
  if (!s) return null
  const t = Date.parse(s)
  return Number.isFinite(t) ? new Date(t).toISOString() : null
}

/* --- Remotive: first-class "legal" category. ------------------------------ */
async function fromRemotive(): Promise<Job[]> {
  const json = await getJson(
    'https://remotive.com/api/remote-jobs?category=legal&limit=100',
  )
  const jobs = arr(asRecord(json).jobs)
  return jobs
    .map((r): Job | null => {
      const j = asRecord(r)
      const url = str(j.url)
      const title = text(j.title)
      if (!url || !title) return null
      return {
        id: `remotive-${str(j.id) || url}`,
        title,
        company: text(j.company_name) || 'Unknown',
        description: toBlurb(str(j.description)),
        salary: text(j.salary) || null,
        location: text(j.candidate_required_location) || 'Remote',
        type: prettyType(str(j.job_type)),
        tags: arr(j.tags).map(text).filter(Boolean).slice(0, 4),
        url,
        source: 'Remotive',
        postedAt: isoFromString(j.publication_date),
      }
    })
    .filter((j): j is Job => j !== null)
}

/* --- Jobicy: general remote board, legal industry + title guard. ---------- */
async function fromJobicy(): Promise<Job[]> {
  const json = await getJson(
    'https://jobicy.com/api/v2/remote-jobs?count=100&industry=legal',
  )
  const jobs = arr(asRecord(json).jobs)
  return jobs
    .map((r): Job | null => {
      const j = asRecord(r)
      const url = str(j.url)
      const title = text(j.jobTitle)
      if (!url || !title) return null
      const industries = arr(j.jobIndustry).map(text).join(' ')
      if (!titleLooksLegal(`${title} ${industries}`)) return null

      const cur = str(j.salaryCurrency) || 'USD'
      const salary = salaryRange(
        num(j.annualSalaryMin),
        num(j.annualSalaryMax),
        cur,
      )
      const types = arr(j.jobType).map(str).filter(Boolean)
      return {
        id: `jobicy-${str(j.id) || url}`,
        title,
        company: text(j.companyName) || 'Unknown',
        description: toBlurb(str(j.jobExcerpt) || str(j.jobDescription)),
        salary,
        location: text(j.jobGeo) || 'Remote',
        type: prettyType(types[0]),
        tags: arr(j.jobIndustry).map(text).filter(Boolean).slice(0, 4),
        url,
        source: 'Jobicy',
        postedAt: isoFromString(j.pubDate),
      }
    })
    .filter((j): j is Job => j !== null)
}

/* --- The Muse: general board with a real "Legal" category (incl. on-site). */
async function fromTheMuse(): Promise<Job[]> {
  const key = process.env.MUSE_API_KEY
  const pages = [1, 2, 3]
  const results = await Promise.all(
    pages.map((p) =>
      getJson(
        `https://www.themuse.com/api/public/jobs?category=Legal&page=${p}${
          key ? `&api_key=${key}` : ''
        }`,
      ),
    ),
  )
  const jobs: Job[] = []
  for (const json of results) {
    for (const r of arr(asRecord(json).results)) {
      const j = asRecord(r)
      const refs = asRecord(j.refs)
      const url = str(refs.landing_page)
      const title = text(j.name)
      if (!url || !title) continue
      const company = text(asRecord(j.company).name) || 'Unknown'
      const locations = arr(j.locations)
        .map((l) => text(asRecord(l).name))
        .filter(Boolean)
      const levels = arr(j.levels)
        .map((l) => text(asRecord(l).name))
        .filter(Boolean)
      jobs.push({
        id: `muse-${str(j.id) || url}`,
        title,
        company,
        description: toBlurb(str(j.contents)),
        salary: null, // The Muse doesn't expose salary
        location: locations[0] || 'See posting',
        type: prettyType(str(j.type)) ?? (levels[0] || null),
        tags: levels.slice(0, 3),
        url,
        source: 'The Muse',
        postedAt: isoFromString(j.publication_date),
      })
    }
  }
  return jobs
}

/* --- Arbeitnow: general board, title-filtered to legal. ------------------- */
async function fromArbeitnow(): Promise<Job[]> {
  const json = await getJson('https://www.arbeitnow.com/api/job-board-api')
  const jobs = arr(asRecord(json).data)
  return jobs
    .map((r): Job | null => {
      const j = asRecord(r)
      const url = str(j.url)
      const title = text(j.title)
      if (!url || !title || !titleLooksLegal(title)) return null
      const types = arr(j.job_types).map(str).filter(Boolean)
      return {
        id: `arbeitnow-${str(j.slug) || url}`,
        title,
        company: text(j.company_name) || 'Unknown',
        description: toBlurb(str(j.description)),
        salary: null,
        location: text(j.location) || (j.remote ? 'Remote' : 'See posting'),
        type: prettyType(types[0]),
        tags: arr(j.tags).map(text).filter(Boolean).slice(0, 4),
        url,
        source: 'Arbeitnow',
        postedAt: isoFromUnix(j.created_at),
      }
    })
    .filter((j): j is Job => j !== null)
}

/* --- RemoteOK: general remote board, title-filtered to legal. ------------- */
async function fromRemoteOK(): Promise<Job[]> {
  const json = await getJson('https://remoteok.com/api')
  // The first array element is a legal/notice object, not a job.
  const rows = arr(json).filter((r) => str(asRecord(r).id) !== '')
  return rows
    .map((r): Job | null => {
      const j = asRecord(r)
      const url = str(j.url) || str(j.apply_url)
      const title = text(j.position) || text(j.title)
      if (!url || !title || !titleLooksLegal(title)) return null
      const salary = salaryRange(num(j.salary_min), num(j.salary_max), 'USD')
      return {
        id: `remoteok-${str(j.id) || url}`,
        title,
        company: text(j.company) || 'Unknown',
        description: toBlurb(str(j.description)),
        salary,
        location: text(j.location) || 'Remote',
        type: null,
        tags: arr(j.tags).map(text).filter(Boolean).slice(0, 4),
        url,
        source: 'RemoteOK',
        postedAt: isoFromString(j.date),
      }
    })
    .filter((j): j is Job => j !== null)
}

/* --- Adzuna: keyed. Huge aggregator with salaries, "legal-jobs" category. - */
async function fromAdzuna(): Promise<Job[]> {
  const id = process.env.ADZUNA_APP_ID
  const key = process.env.ADZUNA_APP_KEY
  if (!id || !key) return []
  const base = 'https://api.adzuna.com/v1/api/jobs/us/search'
  const results = await Promise.all(
    [1, 2].map((p) =>
      getJson(
        `${base}/${p}?app_id=${id}&app_key=${key}` +
          `&results_per_page=50&category=legal-jobs&content-type=application/json`,
      ),
    ),
  )
  const jobs: Job[] = []
  for (const json of results) {
    for (const r of arr(asRecord(json).results)) {
      const j = asRecord(r)
      const url = str(j.redirect_url)
      const title = text(j.title)
      if (!url || !title) continue
      jobs.push({
        id: `adzuna-${str(j.id) || url}`,
        title,
        company: text(asRecord(j.company).display_name) || 'Unknown',
        description: toBlurb(str(j.description)),
        salary: salaryRange(num(j.salary_min), num(j.salary_max), 'USD'),
        location: text(asRecord(j.location).display_name) || 'See posting',
        type: prettyType(str(j.contract_time)),
        tags: [text(asRecord(j.category).label)].filter(Boolean),
        url,
        source: 'Adzuna',
        postedAt: isoFromString(j.created),
      })
    }
  }
  return jobs
}

/* --- USAJOBS: keyed. U.S. federal attorney/legal postings. ---------------- */
async function fromUSAJobs(): Promise<Job[]> {
  const key = process.env.USAJOBS_API_KEY
  const email = process.env.USAJOBS_EMAIL
  if (!key || !email) return []
  const json = await getJson(
    'https://data.usajobs.gov/api/search?JobCategoryCode=0905&ResultsPerPage=50',
    { 'Authorization-Key': key, Host: 'data.usajobs.gov', 'User-Agent': email },
  )
  const items = arr(asRecord(asRecord(json).SearchResult).SearchResultItems)
  return items
    .map((r): Job | null => {
      const d = asRecord(asRecord(r).MatchedObjectDescriptor)
      const url = str(d.PositionURI)
      const title = text(d.PositionTitle)
      if (!url || !title) return null
      const pay = asRecord(arr(d.PositionRemuneration)[0])
      const salary = salaryRange(
        num(pay.MinimumRange),
        num(pay.MaximumRange),
        'USD',
      )
      return {
        id: `usajobs-${str(d.PositionID) || url}`,
        title,
        company: text(d.OrganizationName) || 'U.S. Federal Government',
        description: toBlurb(
          str(asRecord(asRecord(d.UserArea).Details).JobSummary),
        ),
        salary,
        location:
          arr(d.PositionLocation)
            .map((l) => text(asRecord(l).LocationName))
            .filter(Boolean)[0] || 'United States',
        type: prettyType(
          str(asRecord(arr(d.PositionSchedule)[0]).Name),
        ),
        tags: ['Government'],
        url,
        source: 'USAJOBS',
        postedAt: isoFromString(d.PublicationStartDate),
      }
    })
    .filter((j): j is Job => j !== null)
}

export type FetchResult = {
  jobs: Job[]
  source: 'live' | 'sample'
  sources: string[]
}

// De-dupe across boards: the same role often appears on more than one.
function dedupe(jobs: Job[]): Job[] {
  const seen = new Set<string>()
  const out: Job[] = []
  for (const j of jobs) {
    const key = `${j.title}|${j.company}`
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(j)
  }
  return out
}

function sortNewestFirst(jobs: Job[]): Job[] {
  return [...jobs].sort((a, b) => {
    const ta = a.postedAt ? Date.parse(a.postedAt) : 0
    const tb = b.postedAt ? Date.parse(b.postedAt) : 0
    return tb - ta
  })
}

export async function fetchJobs(): Promise<FetchResult> {
  const sourceFns: [string, () => Promise<Job[]>][] = [
    ['Remotive', fromRemotive],
    ['Jobicy', fromJobicy],
    ['The Muse', fromTheMuse],
    ['Arbeitnow', fromArbeitnow],
    ['RemoteOK', fromRemoteOK],
    ['Adzuna', fromAdzuna],
    ['USAJOBS', fromUSAJobs],
  ]

  const settled = await Promise.allSettled(sourceFns.map(([, fn]) => fn()))

  const collected: Job[] = []
  const sources: string[] = []
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value.length > 0) {
      collected.push(...r.value)
      sources.push(sourceFns[i][0])
    }
  })

  if (collected.length === 0) {
    return { jobs: SAMPLE_JOBS, source: 'sample', sources: [] }
  }

  const jobs = sortNewestFirst(dedupe(collected)).slice(0, MAX_RESULTS)
  return { jobs, source: 'live', sources }
}
