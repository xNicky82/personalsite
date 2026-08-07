// Server-side legal-jobs aggregator.
//
// This module is only ever imported by the server component in page.tsx, so its
// network calls happen on the server (at build / revalidate time), never in the
// browser. It pulls from free, key-less public job boards, normalizes every
// posting into the shared `Job` shape, de-dupes, sorts newest-first, and returns
// a `source` flag. If every board is unreachable it falls back to SAMPLE_JOBS so
// the page always renders — the same graceful-degradation pattern as /condos.

import {
  type Job,
  SAMPLE_JOBS,
  looksLegal,
  prettyType,
  toBlurb,
} from './data'

const TIMEOUT_MS = 9000
const REVALIDATE_S = 3600 // re-fetch each source at most hourly

type Raw = Record<string, unknown>

function str(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v).trim()
}
function num(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(str(v).replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) ? n : 0
}
function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}

async function getJson(url: string): Promise<Raw | null> {
  try {
    const res = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: REVALIDATE_S },
    })
    if (!res.ok) return null
    return (await res.json()) as Raw
  } catch {
    return null
  }
}

// Compact a currency amount to "$120k" style; leaves small/odd values alone.
function shortMoney(n: number, currency: string): string {
  const sym = currency === 'USD' || !currency ? '$' : `${currency} `
  if (n >= 1000) return `${sym}${Math.round(n / 1000)}k`
  return `${sym}${n}`
}

// --- Remotive: has a first-class "legal" category, no key required. ----------
// https://remotive.com/api/remote-jobs?category=legal
async function fromRemotive(): Promise<Job[]> {
  const json = await getJson('https://remotive.com/api/remote-jobs?category=legal')
  if (!json) return []
  return arr(json.jobs)
    .map((r): Job | null => {
      const j = r as Raw
      const url = str(j.url)
      const title = str(j.title)
      if (!url || !title) return null
      const salary = str(j.salary)
      return {
        id: `remotive-${str(j.id) || url}`,
        title,
        company: str(j.company_name) || 'Unknown',
        description: toBlurb(str(j.description)),
        salary: salary || null,
        location: str(j.candidate_required_location) || 'Remote',
        type: prettyType(str(j.job_type)),
        tags: arr(j.tags).map(str).filter(Boolean).slice(0, 4),
        url,
        source: 'Remotive',
        postedAt: str(j.publication_date) || null,
      }
    })
    .filter((j): j is Job => j !== null)
}

// --- Jobicy: general remote board; filter down to legal roles by keyword. ----
// https://jobicy.com/api/v2/remote-jobs
async function fromJobicy(): Promise<Job[]> {
  const json = await getJson('https://jobicy.com/api/v2/remote-jobs?count=100&industry=legal')
  if (!json) return []
  return arr(json.jobs)
    .map((r): Job | null => {
      const j = r as Raw
      const url = str(j.url)
      const title = str(j.jobTitle)
      if (!url || !title) return null
      const industries = arr(j.jobIndustry).map(str).join(' ')
      // Guard against the source ignoring the industry filter.
      if (!looksLegal(`${title} ${industries}`)) return null

      const min = num(j.annualSalaryMin)
      const max = num(j.annualSalaryMax)
      const cur = str(j.salaryCurrency) || 'USD'
      let salary: string | null = null
      if (min > 0 && max > 0)
        salary = `${shortMoney(min, cur)} – ${shortMoney(max, cur)}`
      else if (max > 0) salary = `Up to ${shortMoney(max, cur)}`
      else if (min > 0) salary = `From ${shortMoney(min, cur)}`

      const types = arr(j.jobType).map(str).filter(Boolean)
      return {
        id: `jobicy-${str(j.id) || url}`,
        title,
        company: str(j.companyName) || 'Unknown',
        description: toBlurb(str(j.jobExcerpt) || str(j.jobDescription)),
        salary,
        location: str(j.jobGeo) || 'Remote',
        type: prettyType(types[0]),
        tags: arr(j.jobIndustry).map(str).filter(Boolean).slice(0, 4),
        url,
        source: 'Jobicy',
        postedAt: str(j.pubDate) || null,
      }
    })
    .filter((j): j is Job => j !== null)
}

export type FetchResult = {
  jobs: Job[]
  source: 'live' | 'sample'
  sources: string[] // which live boards returned anything
}

// De-dupe across boards: the same role often appears on more than one.
function dedupe(jobs: Job[]): Job[] {
  const seen = new Set<string>()
  const out: Job[] = []
  for (const j of jobs) {
    const key = `${j.title}|${j.company}`.toLowerCase().replace(/\s+/g, ' ').trim()
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
  const results = await Promise.allSettled([fromRemotive(), fromJobicy()])

  const collected: Job[] = []
  const sources: string[] = []
  const labels = ['Remotive', 'Jobicy']
  results.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value.length > 0) {
      collected.push(...r.value)
      sources.push(labels[i])
    }
  })

  if (collected.length === 0) {
    return { jobs: SAMPLE_JOBS, source: 'sample', sources: [] }
  }

  return {
    jobs: sortNewestFirst(dedupe(collected)),
    source: 'live',
    sources,
  }
}
