'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Job } from './data'

// The 15 legal roles that drive both the "Show me ___ roles" dropdown and the
// "Explore other legal roles" sidebar — one legal equivalent for each of the
// roles Wellfound surfaces. `kw` is matched against a posting's title, tags,
// and description.
type Role = { label: string; kw: string[] }

const ROLES: Role[] = [
  { label: 'Corporate Counsel', kw: ['corporate counsel', 'corporate'] },
  { label: 'Legal Assistant', kw: ['legal assistant', 'assistant'] },
  { label: 'Legal Operations Manager', kw: ['legal operations', 'legal ops', 'legalops'] },
  { label: 'Crypto Counsel', kw: ['crypto', 'web3', 'blockchain', 'digital asset'] },
  { label: 'Contracts Counsel', kw: ['contract'] },
  { label: 'Compliance Counsel', kw: ['compliance'] },
  { label: 'Corporate Attorney', kw: ['corporate attorney', 'attorney'] },
  { label: 'Litigation Attorney', kw: ['litigation', 'litigator', 'dispute'] },
  { label: 'Lead Counsel', kw: ['lead counsel', 'senior counsel', 'head of legal'] },
  { label: 'Privacy Counsel', kw: ['privacy', 'data protection', 'gdpr'] },
  { label: 'Legal Operations Analyst', kw: ['operations analyst', 'legal operations', 'legal ops'] },
  { label: 'Commercial Counsel', kw: ['commercial'] },
  { label: 'Regulatory Counsel', kw: ['regulatory', 'regulation'] },
  { label: 'Sales Counsel', kw: ['sales counsel', 'commercial counsel', 'deal desk'] },
  { label: 'General Counsel', kw: ['general counsel', 'head of legal', 'gc'] },
]

// Cities to echo Wellfound's "Explore … jobs in other places".
const PLACES = [
  'San Francisco',
  'New York',
  'Los Angeles',
  'Chicago',
  'Boston',
  'Washington DC',
  'Austin',
  'Toronto',
  'London',
  'Remote',
]

const PAGE_SIZE = 15

// Brand accent (Spellbook orange). Centralized so the whole board's accent can
// be changed — or the rebrand reverted — from one place.
const ACCENT = '#FF4716'

export function LegalJobsApp({
  jobs,
  source,
}: {
  jobs: Job[]
  source: 'live' | 'sample'
}) {
  const [roleLabel, setRoleLabel] = useState('') // '' = all legal roles
  const [loc, setLoc] = useState('')
  const [page, setPage] = useState(1)

  // `?embed=1` hides the top nav so the board can be dropped into another site
  // (e.g. the Webflow iframe). Detected on the client so this page stays static
  // and edge-cached — reading the query on the server would make it slow.
  const [embed, setEmbed] = useState(false)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setEmbed(p.get('embed') === '1' || p.get('embed') === 'true')
  }, [])

  const activeRole = useMemo(
    () => ROLES.find((r) => r.label === roleLabel) ?? null,
    [roleLabel],
  )

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (activeRole && !matchesRole(j, activeRole.kw)) return false
      if (loc && !matchesLocation(j, loc)) return false
      return true
    })
  }, [jobs, activeRole, loc])

  // Reset to the first page whenever the filters change.
  useEffect(() => {
    setPage(1)
  }, [roleLabel, loc])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const slice = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const groups = groupByCompany(slice)

  const heading = activeRole ? `${activeRole.label} roles` : 'All legal roles'
  const headingLoc = loc ? ` · ${loc}` : ''

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black font-[family-name:var(--font-sohne)] text-white antialiased">
      {/* top nav — hidden when embedded in another site via ?embed=1 */}
      {!embed && (
        <nav className="sticky top-0 z-10 border-b border-white/10 bg-black/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
            <a href="/" className="text-lg font-semibold tracking-tight">
              Legal Jobs<span className="text-white/40">.</span>
            </a>
            <div className="flex items-center gap-6 text-sm text-white/60">
              <a href="#results" className="hover:text-white">
                Find Jobs
              </a>
              <a
                href="/"
                className="rounded-md border border-white/20 px-3 py-1.5 font-medium text-white transition-colors hover:bg-white/10"
              >
                Portfolio
              </a>
            </div>
          </div>
        </nav>
      )}

      <main className="mx-auto w-full max-w-6xl px-5 pt-8 pb-24">
        {/* headline */}
        <header className="mb-10">
          <h1 className="max-w-3xl text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl">
            Helping lawyers <span style={{ color: ACCENT }}>find careers</span>{' '}
            in legal AI
          </h1>
          <div className="mt-4 flex items-center gap-2.5 text-sm text-white/60">
            <span>Powered by</span>
            <span className="text-lg">
              <RedlineLogo />
            </span>
          </div>
        </header>

        {/* natural-language search */}
        <section className="flex flex-wrap items-center gap-x-3 gap-y-3 text-xl font-medium sm:text-2xl">
          <span>Show me</span>
          <div className="relative">
            <select
              value={roleLabel}
              onChange={(e) => setRoleLabel(e.target.value)}
              aria-label="Role"
              className="cursor-pointer appearance-none rounded-lg border border-white/20 bg-white/5 py-2 pr-9 pl-4 text-base font-medium text-white focus:border-white focus:outline-none [&>option]:text-black"
            >
              <option value="">all legal</option>
              {ROLES.map((r) => (
                <option key={r.label} value={r.label}>
                  {r.label}
                </option>
              ))}
            </select>
            <Caret />
          </div>
          <span>roles, that are</span>
          <div className="relative flex items-center">
            <input
              value={loc}
              onChange={(e) => setLoc(e.target.value)}
              placeholder="Anywhere"
              aria-label="Location"
              className="w-44 rounded-lg border border-white/20 bg-white/5 py-2 pr-9 pl-4 text-base font-medium text-white placeholder:font-normal placeholder:text-white/40 focus:border-white focus:outline-none"
            />
            {loc && (
              <button
                type="button"
                onClick={() => setLoc('')}
                aria-label="Clear location"
                className="absolute right-2.5 text-white/40 hover:text-white"
              >
                <XIcon />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setPage(1)}
            className="rounded-lg bg-white px-5 py-2 text-base font-medium text-black transition-colors hover:bg-white/90"
          >
            Search
          </button>
        </section>

        {source === 'sample' && (
          <p className="mt-6 rounded-lg border border-dashed border-white/20 px-4 py-3 text-xs leading-relaxed text-white/60">
            Live boards weren’t reachable, so these are representative sample
            roles linking to each company’s careers page. Live postings load
            automatically once a source responds.
          </p>
        )}

        {/* two-column: results + explore sidebar */}
        <div
          id="results"
          className="mt-8 grid scroll-mt-20 grid-cols-1 gap-10 border-t border-white/10 pt-8 lg:grid-cols-[1fr_300px]"
        >
          <div>
            {slice.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/20 py-16 text-center">
                <p className="text-sm text-white/60">No postings match that.</p>
                <button
                  onClick={() => {
                    setRoleLabel('')
                    setLoc('')
                  }}
                  className="mt-3 text-sm font-medium underline underline-offset-4"
                  type="button"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <ul className="space-y-4">
                {groups.map((g) => (
                  <CompanyCard
                    key={g.company}
                    company={g.company}
                    roles={g.roles}
                  />
                ))}
              </ul>
            )}

            {/* summary + pagination, at the bottom of the listings */}
            <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-base font-semibold tracking-tight">
                  {heading}
                  <span className="font-normal text-white/40">{headingLoc}</span>
                </div>
                <div className="mt-0.5 text-sm text-white/50">
                  {filtered.length} results total
                </div>
              </div>
              {pages > 1 && (
                <Pagination
                  current={current}
                  pages={pages}
                  onChange={(p) => {
                    setPage(p)
                    document
                      .getElementById('results')
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }}
                />
              )}
            </div>
          </div>

          <aside className="space-y-10">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Explore other legal roles
              </h2>
              <ul className="mt-4 space-y-2.5">
                {ROLES.map((r) => (
                  <li key={r.label}>
                    <button
                      type="button"
                      onClick={() => {
                        setRoleLabel(r.label)
                        document
                          .getElementById('results')
                          ?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className="text-left text-sm text-white/60 underline-offset-4 hover:text-white hover:underline"
                    >
                      {r.label} Remote
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Explore legal jobs in other places
              </h2>
              <ul className="mt-4 space-y-2.5">
                {PLACES.map((p) => (
                  <li key={p}>
                    <button
                      type="button"
                      onClick={() => {
                        setLoc(p)
                        document
                          .getElementById('results')
                          ?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className="text-left text-sm text-white/60 underline-offset-4 hover:text-white hover:underline"
                    >
                      Legal Jobs — {p}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        <footer className="mt-16 border-t border-white/10 pt-6 text-xs leading-relaxed text-white/40">
          Postings are aggregated from public job boards and shown with their
          original title, a short description, salary where the source lists it,
          and a link back to the original posting. Listings and salaries are the
          responsibility of the originating employer and board.
        </footer>
      </main>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

// Company logo with graceful fallback: try Clearbit's logo, then the domain's
// favicon, then finally the company's initials — so the tile always renders.
function CompanyLogo({
  name,
  domain,
}: {
  name: string
  domain: string | null
}) {
  const [failed, setFailed] = useState(false)

  // A light tile so brand logos (and the initials fallback) read on the dark card.
  const tile =
    'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white'

  if (!domain || failed) {
    return (
      <span className={`${tile} text-sm font-semibold text-zinc-600`}>
        {initials(name)}
      </span>
    )
  }

  // Same-origin, edge-cached proxy — reliable and fast after the first hit.
  const src = `/legaljobs/logo?domain=${encodeURIComponent(domain)}&name=${encodeURIComponent(name)}`

  return (
    <span className={tile}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${name} logo`}
        width={40}
        height={40}
        loading="eager"
        decoding="async"
        className="h-full w-full object-contain"
        onError={() => setFailed(true)}
      />
    </span>
  )
}

function CompanyCard({
  company,
  roles,
}: {
  company: string
  roles: Job[]
}) {
  const boards = Array.from(new Set(roles.map((r) => r.source)))
  return (
    <li className="overflow-hidden rounded-xl border border-white/10">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        <CompanyLogo name={company} domain={roles[0]?.domain ?? null} />
        <div className="min-w-0">
          <div className="truncate font-semibold">{company}</div>
          <div className="text-xs text-white/50">
            {roles.length} open {roles.length === 1 ? 'role' : 'roles'} ·{' '}
            {boards.join(', ')}
          </div>
        </div>
      </div>

      <ul className="divide-y divide-white/10">
        {roles.map((job) => (
          <RoleRow key={job.id} job={job} />
        ))}
      </ul>
    </li>
  )
}

function RoleRow({ job }: { job: Job }) {
  const posted = relativeDate(job.postedAt)
  // Company-site roles get their own on-domain detail page; other sources
  // (e.g. the sample fallback) link straight out.
  const detailHref =
    job.source === 'Company site'
      ? `/legaljobs/${encodeURIComponent(job.id)}`
      : null
  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {detailHref ? (
            <a
              href={detailHref}
              className="font-medium underline-offset-4 hover:underline"
            >
              {job.title}
            </a>
          ) : (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline-offset-4 hover:underline"
            >
              {job.title}
            </a>
          )}
          {job.type && (
            <span className="inline-flex shrink-0 items-center rounded-full border border-white/20 px-2 py-0.5 text-xs font-medium text-white/70">
              {job.type}
            </span>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/50">
          {job.salary && (
            <span className="font-medium text-white">{job.salary}</span>
          )}
          {job.salary && job.location && (
            <span className="text-white/30">·</span>
          )}
          {job.location && <span>{job.location}</span>}
          {posted && (
            <>
              <span className="text-white/30">·</span>
              <span>{posted}</span>
            </>
          )}
        </div>

        {job.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/60">
            {job.description}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 self-start">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ backgroundColor: ACCENT }}
          className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Apply
        </a>
      </div>
    </li>
  )
}

function Pagination({
  current,
  pages,
  onChange,
}: {
  current: number
  pages: number
  onChange: (page: number) => void
}) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(current - 1)}
        disabled={current <= 1}
        className="rounded-md border border-white/20 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-sm whitespace-nowrap text-white/50">
        Page {current} of {pages}
      </span>
      <button
        type="button"
        onClick={() => onChange(current + 1)}
        disabled={current >= pages}
        className="rounded-md border border-white/20 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </div>
  )
}

// "The Redline" wordmark — white text with the brand accent struck through it,
// extending slightly past the text on each side.
function RedlineLogo() {
  return (
    <span className="relative inline-block font-semibold whitespace-nowrap text-white">
      The Redline
      <span
        aria-hidden
        style={{ backgroundColor: ACCENT }}
        className="absolute top-1/2 right-[-0.12em] left-[-0.12em] h-[2px] -translate-y-1/2"
      />
    </span>
  )
}

function Caret() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-white/40"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

/* helpers ------------------------------------------------------------------ */

function haystack(job: Job): string {
  return `${job.title} ${job.tags.join(' ')} ${job.description}`.toLowerCase()
}

function matchesRole(job: Job, kw: string[]): boolean {
  const h = haystack(job)
  return kw.some((k) => h.includes(k.toLowerCase()))
}

function matchesLocation(job: Job, loc: string): boolean {
  const l = (job.location ?? '').toLowerCase()
  const q = loc.toLowerCase()
  if (q === 'remote')
    return /remote|everywhere|anywhere|global|worldwide/.test(l)
  return l.includes(q)
}

function groupByCompany(jobs: Job[]): { company: string; roles: Job[] }[] {
  const map = new Map<string, Job[]>()
  for (const j of jobs) {
    const list = map.get(j.company)
    if (list) list.push(j)
    else map.set(j.company, [j])
  }
  return Array.from(map.entries()).map(([company, roles]) => ({
    company,
    roles,
  }))
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '—'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function relativeDate(iso: string | null): string | null {
  if (!iso) return null
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return null
  const days = Math.round((Date.now() - t) / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.round(days / 7)}w ago`
  if (days < 365) return `${Math.round(days / 30)}mo ago`
  return `${Math.round(days / 365)}y ago`
}
