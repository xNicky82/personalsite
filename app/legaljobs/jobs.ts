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
  htmlToText,
  prettyType,
  titleLooksLegal,
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

// Phrases that signal a block is describing the ROLE (vs. the company).
const ROLE_CUES = [
  "you'll",
  'you will',
  'you’ll',
  'your role',
  'the role',
  'in this role',
  'as a ',
  'as the ',
  'we are looking',
  'we’re looking',
  "we're looking",
  'responsib',
  'what you',
  'who you are',
  'your impact',
  'day-to-day',
  'day to day',
  'on this team',
  'requirements',
  'qualifications',
  'what we',
]
const COMPANY_LEAD = /^(about\b|who we are|our mission|our story|our team\b|company\b)/i

// Split HTML into block-level chunks of plain text, preserving boundaries so we
// can tell the "About the company" intro apart from the role content.
const BLOCK_MARK = '~~BLK~~'
function splitBlocks(html: string): string[] {
  // Decode first so entity-encoded markup (Greenhouse's "&lt;/p&gt;") becomes
  // real tags, then mark block boundaries, strip remaining tags, and split.
  const marked = decodeEntities(html)
    .replace(/<\/(p|div|li|h[1-6]|ul|ol|section|header|tr)>/gi, BLOCK_MARK)
    .replace(/<br\s*\/?>/gi, BLOCK_MARK)
  const text = decodeEntities(marked.replace(/<[^>]*>/g, ' ')).replace(
    /\s+/g,
    ' ',
  )
  return text
    .split(BLOCK_MARK)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

// Build a short summary that talks about the JOB — skipping company boilerplate.
function roleSummary(html: string, company: string, max = 340): string {
  const blocks = splitBlocks(html)
  if (blocks.length === 0) return ''
  const companyLc = company.toLowerCase()
  const hasRoleCue = (b: string) => {
    const lc = b.toLowerCase()
    return ROLE_CUES.some((c) => lc.includes(c))
  }
  const isCompanyBlock = (b: string) => {
    const lc = b.toLowerCase()
    if (COMPANY_LEAD.test(b)) return true
    return (
      lc.includes(companyLc) &&
      /\b(is|are|was|founded|mission|building|reinventing|leading|provider|platform|company)\b/.test(lc) &&
      !hasRoleCue(b)
    )
  }

  let start = blocks.findIndex(hasRoleCue)
  if (start === -1) {
    start = 0
    while (start < blocks.length - 1 && isCompanyBlock(blocks[start])) start++
  } else if (blocks[start].length < 30 && start < blocks.length - 1) {
    start++ // matched a short heading like "The role" — use the next block
  }

  let out = ''
  for (let i = start; i < blocks.length; i++) {
    const b = blocks[i]
    if (b.length < 30 && /[:]$|^[A-Z][A-Za-z ]{2,24}$/.test(b)) continue // skip headings
    out = out ? `${out} ${b}` : b
    if (out.length >= max) break
  }
  if (!out) out = blocks[start] ?? blocks[0]

  const text = out.replace(/\s+/g, ' ').trim()
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const stop = Math.max(
    cut.lastIndexOf('. '),
    cut.lastIndexOf('! '),
    cut.lastIndexOf('? '),
  )
  return stop > max * 0.5 ? cut.slice(0, stop + 1) : cut.replace(/\s+\S*$/, '') + '…'
}

// Pull a plausible annual salary range out of free text, e.g. "$120,000 –
// $160,000" or "$120K to $160K" → "$120k – $160k". Returns null if none.
function extractSalary(text: string): string | null {
  if (!text) return null
  const re =
    /\$\s?(\d[\d.,]*)\s?([kK])?\s?(?:–|—|-|to)\s?\$?\s?(\d[\d.,]*)\s?([kK])?/
  const m = text.match(re)
  if (!m) return null
  const toN = (numStr: string, k?: string) => {
    let n = parseFloat(numStr.replace(/,/g, ''))
    if (!Number.isFinite(n)) return 0
    if (k) n *= 1000
    if (n < 1000) n *= 1000 // bare "120" almost always means 120k in this context
    return n
  }
  const lo = toN(m[1], m[2])
  const hi = toN(m[3], m[4])
  // Only accept a plausible annual-salary range.
  if (lo < 30000 || hi <= lo || hi > 1_000_000) return null
  return `$${Math.round(lo / 1000)}k – $${Math.round(hi / 1000)}k`
}

/* --- Company ATS boards, filtered to legal roles. ------------------------- */

// Greenhouse: https://boards-api.greenhouse.io/v1/boards/<token>/jobs
async function fromGreenhouse(c: CompanyBoard): Promise<Job[]> {
  // content=true so we can build a role-focused blurb and read pay ranges.
  const json = await getJson(
    `https://boards-api.greenhouse.io/v1/boards/${c.token}/jobs?content=true`,
  )
  return arr(asRecord(json).jobs)
    .map((r): Job | null => {
      const j = asRecord(r)
      const url = str(j.absolute_url)
      const title = text(j.title)
      if (!url || !title || !titleLooksLegal(title)) return null
      const content = str(j.content)
      return {
        id: `gh-${c.token}-${str(j.id) || url}`,
        title,
        company: c.name,
        description: roleSummary(content, c.name, 200),
        salary: extractSalary(htmlToText(content)),
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
      const dHtml = str(j.descriptionHtml) || str(j.descriptionPlain)
      return {
        id: `ashby-${c.token}-${str(j.id) || url}`,
        title,
        company: c.name,
        description: roleSummary(dHtml, c.name, 200),
        salary: comp || extractSalary(htmlToText(dHtml)),
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
      const descHtml = str(p.description) || str(p.descriptionPlain)
      return {
        id: `lever-${c.token}-${str(p.id) || url}`,
        title,
        company: c.name,
        description: roleSummary(descHtml, c.name, 200),
        salary: extractSalary(str(p.descriptionPlain) || htmlToText(descHtml)),
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
    const content = str(j.content)
    return {
      id: slug,
      title,
      company,
      domain,
      location: loc(asRecord(j.location).name) || null,
      salary: extractSalary(htmlToText(content)),
      type: null,
      postedAt: isoFromString(j.updated_at),
      url,
      summary: roleSummary(content, company),
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
    const descHtml = str(p.description) || str(p.descriptionPlain)
    return {
      id: slug,
      title,
      company,
      domain,
      location: loc(cats.location) || null,
      salary: extractSalary(str(p.descriptionPlain) || htmlToText(descHtml)),
      type: prettyType(str(cats.commitment)),
      postedAt: isoFromUnix(p.createdAt),
      url,
      summary: roleSummary(descHtml, company),
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
    const dHtml = str(j.descriptionHtml) || str(j.descriptionPlain)
    return {
      id: slug,
      title,
      company,
      domain,
      location: loc(j.location) || (j.isRemote ? 'Remote' : null),
      salary: comp || extractSalary(htmlToText(dHtml)),
      type: mapEmploymentType(str(j.employmentType)),
      postedAt: isoFromString(j.publishedAt) ?? isoFromString(j.publishedDate),
      url,
      summary: roleSummary(dHtml, company),
      source: COMPANY_SOURCE,
    }
  }

  return null
}
