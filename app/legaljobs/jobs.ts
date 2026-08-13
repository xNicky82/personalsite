// Server-side legal-jobs aggregator.
//
// This module is only ever imported by the server component in page.tsx, so its
// network calls happen on the server (at build / revalidate time), never in the
// browser — which also sidesteps the CORS walls these boards put up.
//
// It pulls legal roles straight from the careers pages of the top tech / AI
// companies in `companies.ts`. Each company runs a public ATS (Greenhouse,
// Ashby, or Lever) that exposes a key-less JSON endpoint listing every open
// role with a direct link to the posting; we fetch each board, keep only the
// legal roles, and link back to the company's own apply page. If every board is
// unreachable it falls back to SAMPLE_JOBS so the page always renders — the
// same graceful-degradation pattern as /condos.

import { COMPANY_BOARDS, type CompanyBoard } from './companies'
import {
  type Job,
  SAMPLE_JOBS,
  decodeEntities,
  prettyType,
  titleLooksLegal,
  toBlurb,
} from './data'

const TIMEOUT_MS = 9000
const REVALIDATE_S = 3600 // re-fetch each board at most hourly
const MAX_RESULTS = 400 // safety cap on the merged, de-duped list
const UA =
  'Mozilla/5.0 (compatible; LegalJobsBot/1.0; +https://nicholasrocha.com/legaljobs)'
const COMPANY_SOURCE = 'Company site'

type Raw = Record<string, unknown>

function str(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v).trim()
}
function text(v: unknown): string {
  return decodeEntities(str(v))
}
// Location strings from some ATSes join multiple cities with ";". Render each
// "City, ST" group terminated with a period, e.g.
//   "Denver, CO;San Francisco, CA" → "Denver, CO., San Francisco, CA."
// Single locations (e.g. "Remote (US)") are left untouched.
function loc(v: unknown): string {
  const s = text(v)
    .replace(/\s{2,}/g, ' ')
    .trim()
  if (!s.includes(';')) return s
  const parts = s
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean)
  return parts.join('., ') + '.'
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

async function getJson(url: string): Promise<Raw | unknown[] | null> {
  try {
    const res = await fetch(url, {
      headers: { accept: 'application/json', 'user-agent': UA },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: REVALIDATE_S },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
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

function mapEmploymentType(s: string): string | null {
  const map: Record<string, string> = {
    FullTime: 'Full-time',
    PartTime: 'Part-time',
    Contract: 'Contract',
    Intern: 'Internship',
    Temporary: 'Temporary',
  }
  return map[s] ?? prettyType(s)
}

/* --- Company ATS boards, filtered to legal roles. ------------------------- */

// Greenhouse: https://boards-api.greenhouse.io/v1/boards/<token>/jobs
async function fromGreenhouse(c: CompanyBoard): Promise<Job[]> {
  const json = await getJson(
    `https://boards-api.greenhouse.io/v1/boards/${c.token}/jobs`,
  )
  return arr(asRecord(json).jobs)
    .map((r): Job | null => {
      const j = asRecord(r)
      const url = str(j.absolute_url)
      const title = text(j.title)
      if (!url || !title || !titleLooksLegal(title)) return null
      return {
        id: `gh-${c.token}-${str(j.id) || url}`,
        title,
        company: c.name,
        description: '',
        salary: null,
        location: loc(asRecord(j.location).name) || 'See posting',
        type: null,
        tags: [],
        url,
        source: COMPANY_SOURCE,
        postedAt: isoFromString(j.updated_at),
        domain: c.domain,
      }
    })
    .filter((j): j is Job => j !== null)
}

// Ashby: https://api.ashbyhq.com/posting-api/job-board/<token>
async function fromAshby(c: CompanyBoard): Promise<Job[]> {
  const json = await getJson(
    `https://api.ashbyhq.com/posting-api/job-board/${c.token}?includeCompensation=true`,
  )
  return arr(asRecord(json).jobs)
    .map((r): Job | null => {
      const j = asRecord(r)
      const url = str(j.jobUrl) || str(j.applyUrl)
      const title = text(j.title)
      if (!url || !title || !titleLooksLegal(title)) return null
      const comp = str(asRecord(j.compensation).compensationTierSummary)
      return {
        id: `ashby-${c.token}-${str(j.id) || url}`,
        title,
        company: c.name,
        description: toBlurb(str(j.descriptionHtml) || str(j.descriptionPlain)),
        salary: comp || null,
        location: loc(j.location) || (j.isRemote ? 'Remote' : 'See posting'),
        type: mapEmploymentType(str(j.employmentType)),
        tags: [text(j.team) || text(j.department)].filter(Boolean),
        url,
        source: COMPANY_SOURCE,
        postedAt: isoFromString(j.publishedAt) ?? isoFromString(j.publishedDate),
        domain: c.domain,
      }
    })
    .filter((j): j is Job => j !== null)
}

// Lever: https://api.lever.co/v0/postings/<token>?mode=json
async function fromLever(c: CompanyBoard): Promise<Job[]> {
  const json = await getJson(
    `https://api.lever.co/v0/postings/${c.token}?mode=json`,
  )
  return arr(json)
    .map((r): Job | null => {
      const p = asRecord(r)
      const url = str(p.hostedUrl) || str(p.applyUrl)
      const title = text(p.text)
      if (!url || !title || !titleLooksLegal(title)) return null
      const cats = asRecord(p.categories)
      return {
        id: `lever-${c.token}-${str(p.id) || url}`,
        title,
        company: c.name,
        description: toBlurb(str(p.descriptionPlain) || str(p.description)),
        salary: null,
        location: loc(cats.location) || 'See posting',
        type: prettyType(str(cats.commitment)),
        tags: [text(cats.team)].filter(Boolean),
        url,
        source: COMPANY_SOURCE,
        postedAt: isoFromUnix(p.createdAt),
        domain: c.domain,
      }
    })
    .filter((j): j is Job => j !== null)
}

function fetchBoard(c: CompanyBoard): Promise<Job[]> {
  if (c.ats === 'greenhouse') return fromGreenhouse(c)
  if (c.ats === 'ashby') return fromAshby(c)
  if (c.ats === 'lever') return fromLever(c)
  return Promise.resolve([])
}

export type FetchResult = {
  jobs: Job[]
  source: 'live' | 'sample'
}

// De-dupe: the same role can appear more than once (e.g. duplicate listings).
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
  // Every company board is fetched independently and guarded, so one failing
  // (renamed slug, ATS change) never blocks the others.
  const settled = await Promise.allSettled(COMPANY_BOARDS.map(fetchBoard))

  const collected: Job[] = []
  for (const r of settled) if (r.status === 'fulfilled') collected.push(...r.value)

  if (collected.length === 0) {
    return { jobs: SAMPLE_JOBS, source: 'sample' }
  }

  const jobs = sortNewestFirst(dedupe(collected)).slice(0, MAX_RESULTS)
  return { jobs, source: 'live' }
}

/* -------------------------------------------------------------------------- */
/* Single-posting detail — powers the /legaljobs/[slug] pages.                */

export type JobDetail = {
  id: string
  title: string
  company: string
  domain: string | null
  location: string | null
  salary: string | null
  type: string | null
  postedAt: string | null
  url: string // link to the original posting
  summary: string // short excerpt, NOT the full description
  source: string
}

// A short, sentence-aware excerpt of a role's description — a summary, never the
// full verbatim text.
function toSummary(html: string, max = 340): string {
  const text = decodeEntities(html.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '))
  if (lastStop > max * 0.5) return cut.slice(0, lastStop + 1)
  return cut.replace(/\s+\S*$/, '') + '…'
}

const ATS_BY_PREFIX: Record<string, string> = {
  gh: 'greenhouse',
  ashby: 'ashby',
  lever: 'lever',
}

// Job ids look like "gh-<token>-<id>" / "ashby-<token>-<id>" / "lever-<token>-<id>".
// Board tokens never contain a hyphen, but ATS ids can (UUIDs), so split off the
// first two segments and keep the rest as the id.
function parseJobId(
  slug: string,
): { ats: string; token: string; id: string } | null {
  const parts = slug.split('-')
  if (parts.length < 3) return null
  const ats = ATS_BY_PREFIX[parts[0]]
  const token = parts[1]
  const id = parts.slice(2).join('-')
  if (!ats || !token || !id) return null
  return { ats, token, id }
}

export async function fetchJobDetail(slug: string): Promise<JobDetail | null> {
  const parsed = parseJobId(slug)
  if (!parsed) return null
  const { ats, token, id } = parsed

  const board = COMPANY_BOARDS.find(
    (b) => b.token === token && b.ats === ats,
  )
  const company = board?.name ?? token
  const domain = board?.domain ?? null

  if (ats === 'greenhouse') {
    const j = asRecord(
      await getJson(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs/${id}`),
    )
    const url = str(j.absolute_url)
    const title = text(j.title)
    if (!url || !title) return null
    return {
      id: slug,
      title,
      company,
      domain,
      location: loc(asRecord(j.location).name) || null,
      salary: null,
      type: null,
      postedAt: isoFromString(j.updated_at),
      url,
      summary: toSummary(str(j.content)),
      source: COMPANY_SOURCE,
    }
  }

  if (ats === 'lever') {
    const p = asRecord(
      await getJson(`https://api.lever.co/v0/postings/${token}/${id}?mode=json`),
    )
    const url = str(p.hostedUrl) || str(p.applyUrl)
    const title = text(p.text)
    if (!url || !title) return null
    const cats = asRecord(p.categories)
    return {
      id: slug,
      title,
      company,
      domain,
      location: loc(cats.location) || null,
      salary: null,
      type: prettyType(str(cats.commitment)),
      postedAt: isoFromUnix(p.createdAt),
      url,
      summary: toSummary(str(p.descriptionPlain) || str(p.description)),
      source: COMPANY_SOURCE,
    }
  }

  if (ats === 'ashby') {
    // Ashby has no per-posting endpoint — fetch the board and find the posting.
    const json = await getJson(
      `https://api.ashbyhq.com/posting-api/job-board/${token}?includeCompensation=true`,
    )
    const match = arr(asRecord(json).jobs).find(
      (x) => str(asRecord(x).id) === id,
    )
    const j = asRecord(match)
    const url = str(j.jobUrl) || str(j.applyUrl)
    const title = text(j.title)
    if (!url || !title) return null
    const comp = str(asRecord(j.compensation).compensationTierSummary)
    return {
      id: slug,
      title,
      company,
      domain,
      location: loc(j.location) || (j.isRemote ? 'Remote' : null),
      salary: comp || null,
      type: mapEmploymentType(str(j.employmentType)),
      postedAt: isoFromString(j.publishedAt) ?? isoFromString(j.publishedDate),
      url,
      summary: toSummary(str(j.descriptionHtml) || str(j.descriptionPlain)),
      source: COMPANY_SOURCE,
    }
  }

  return null
}
