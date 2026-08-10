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
const SAVED_KEY = 'legaljobs:saved'

export function LegalJobsApp({
  jobs,
  source,
  embed = false,
}: {
  jobs: Job[]
  source: 'live' | 'sample'
  embed?: boolean
}) {
  const [roleLabel, setRoleLabel] = useState('') // '' = all legal roles
  const [loc, setLoc] = useState('')
  const [page, setPage] = useState(1)
  const [saved, setSaved] = useState<Set<string>>(new Set())

  // Persist saved postings client-side — no account needed.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY)
      if (raw) setSaved(new Set(JSON.parse(raw) as string[]))
    } catch {}
  }, [])

  const toggleSave = (id: string) =>
    setSaved((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify([...next]))
      } catch {}
      return next
    })

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white font-[family-name:var(--font-sohne)] text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
      {/* top nav — hidden when embedded in another site via ?embed=1 */}
      {!embed && (
        <nav className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
            <a href="/" className="text-lg font-semibold tracking-tight">
              Legal Jobs<span className="text-zinc-400">.</span>
            </a>
            <div className="flex items-center gap-6 text-sm text-zinc-600 dark:text-zinc-400">
              <a
                href="#results"
                className="hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Find Jobs
              </a>
              <a
                href="/"
                className="rounded-md border border-zinc-300 px-3 py-1.5 font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Portfolio
              </a>
            </div>
          </div>
        </nav>
      )}

      <main className="mx-auto w-full max-w-6xl px-5 pt-8 pb-24">
        {/* page title */}
        <h1 className="mb-8 text-3xl font-semibold tracking-tight sm:text-4xl">
          Browse legal jobs in tech
        </h1>

        {/* natural-language search */}
        <section className="flex flex-wrap items-center gap-x-3 gap-y-3 text-xl font-medium sm:text-2xl">
          <span>Show me</span>
          <div className="relative">
            <select
              value={roleLabel}
              onChange={(e) => setRoleLabel(e.target.value)}
              aria-label="Role"
              className="cursor-pointer appearance-none rounded-lg border border-zinc-300 bg-white py-2 pr-9 pl-4 text-base font-medium text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100"
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
              className="w-44 rounded-lg border border-zinc-300 bg-white py-2 pr-9 pl-4 text-base font-medium text-zinc-900 placeholder:font-normal placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100"
            />
            {loc && (
              <button
                type="button"
                onClick={() => setLoc('')}
                aria-label="Clear location"
                className="absolute right-2.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <XIcon />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setPage(1)}
            className="rounded-lg bg-zinc-900 px-5 py-2 text-base font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Search
          </button>
        </section>

        {source === 'sample' && (
          <p className="mt-6 rounded-lg border border-dashed border-zinc-300 px-4 py-3 text-xs leading-relaxed text-zinc-500 dark:border-zinc-700">
            Live boards weren’t reachable, so these are representative sample
            roles linking to each company’s careers page. Live postings load
            automatically once a source responds.
          </p>
        )}

        {/* results header */}
        <div
          id="results"
          className="mt-8 flex scroll-mt-20 items-baseline justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800"
        >
          <h2 className="text-base font-semibold tracking-tight sm:text-lg">
            {heading}
            <span className="font-normal text-zinc-400">{headingLoc}</span>
          </h2>
          <div className="text-right text-sm">
            <div className="font-semibold">
              Page {current} of {pages}
            </div>
            <div className="text-zinc-500">{filtered.length} results total</div>
          </div>
        </div>

        {/* two-column: results + explore sidebar */}
        <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_300px]">
          <div>
            {slice.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
                <p className="text-sm text-zinc-500">No postings match that.</p>
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
                    saved={saved}
                    onToggleSave={toggleSave}
                  />
                ))}
              </ul>
            )}

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
                      className="text-left text-sm text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
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
                      className="text-left text-sm text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
                    >
                      Legal Jobs — {p}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        <footer className="mt-16 border-t border-zinc-200 pt-6 text-xs leading-relaxed text-zinc-500 dark:border-zinc-800">
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
  const sources = domain
    ? [
        `https://logo.clearbit.com/${domain}`,
        `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      ]
    : []
  const [idx, setIdx] = useState(0)

  const tile =
    'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800'

  if (idx >= sources.length) {
    return (
      <span
        className={`${tile} text-sm font-semibold text-zinc-600 dark:text-zinc-300`}
      >
        {initials(name)}
      </span>
    )
  }

  return (
    <span className={tile}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sources[idx]}
        alt={`${name} logo`}
        width={40}
        height={40}
        loading="lazy"
        className="h-full w-full object-contain"
        onError={() => setIdx((i) => i + 1)}
      />
    </span>
  )
}

function CompanyCard({
  company,
  roles,
  saved,
  onToggleSave,
}: {
  company: string
  roles: Job[]
  saved: Set<string>
  onToggleSave: (id: string) => void
}) {
  const boards = Array.from(new Set(roles.map((r) => r.source)))
  return (
    <li className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <CompanyLogo name={company} domain={roles[0]?.domain ?? null} />
        <div className="min-w-0">
          <div className="truncate font-semibold">{company}</div>
          <div className="text-xs text-zinc-500">
            {roles.length} open {roles.length === 1 ? 'role' : 'roles'} ·{' '}
            {boards.join(', ')}
          </div>
        </div>
      </div>

      <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
        {roles.map((job) => (
          <RoleRow
            key={job.id}
            job={job}
            isSaved={saved.has(job.id)}
            onToggleSave={() => onToggleSave(job.id)}
          />
        ))}
      </ul>
    </li>
  )
}

function RoleRow({
  job,
  isSaved,
  onToggleSave,
}: {
  job: Job
  isSaved: boolean
  onToggleSave: () => void
}) {
  const posted = relativeDate(job.postedAt)
  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline-offset-4 hover:underline"
          >
            {job.title}
          </a>
          {job.type && (
            <span className="inline-flex shrink-0 items-center rounded-full border border-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:border-zinc-800">
              {job.type}
            </span>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
          {job.salary && (
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {job.salary}
            </span>
          )}
          {job.salary && job.location && (
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
          )}
          {job.location && <span>{job.location}</span>}
          {posted && (
            <>
              <span className="text-zinc-300 dark:text-zinc-700">·</span>
              <span>{posted}</span>
            </>
          )}
        </div>

        {job.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {job.description}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 self-start">
        <button
          type="button"
          onClick={onToggleSave}
          aria-pressed={isSaved}
          className={[
            'rounded-md border px-3.5 py-2 text-sm font-medium transition-colors',
            isSaved
              ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
              : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800',
          ].join(' ')}
        >
          {isSaved ? 'Saved' : 'Save'}
        </button>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
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
    <div className="mt-8 flex items-center justify-between border-t border-zinc-200 pt-6 dark:border-zinc-800">
      <button
        type="button"
        onClick={() => onChange(current - 1)}
        disabled={current <= 1}
        className="rounded-md border border-zinc-300 px-3.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        Previous
      </button>
      <span className="text-sm text-zinc-500">
        Page {current} of {pages}
      </span>
      <button
        type="button"
        onClick={() => onChange(current + 1)}
        disabled={current >= pages}
        className="rounded-md border border-zinc-300 px-3.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        Next
      </button>
    </div>
  )
}

function Caret() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-zinc-400"
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
