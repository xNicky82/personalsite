'use client'

import { useMemo, useState } from 'react'
import type { Job } from './data'

export function LegalJobsApp({
  jobs,
  source,
  sources,
}: {
  jobs: Job[]
  source: 'live' | 'sample'
  sources: string[]
}) {
  const [q, setQ] = useState('')
  const [board, setBoard] = useState('any')

  const boards = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.source))).sort((a, b) => a.localeCompare(b)),
    [jobs],
  )

  const results = useMemo(() => {
    const query = q.trim().toLowerCase()
    return jobs.filter((j) => {
      if (board !== 'any' && j.source !== board) return false
      if (
        query &&
        !`${j.title} ${j.company} ${j.tags.join(' ')} ${j.location ?? ''}`
          .toLowerCase()
          .includes(query)
      )
        return false
      return true
    })
  }, [jobs, q, board])

  const withSalary = results.filter((j) => j.salary).length

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white font-[family-name:var(--font-geist)] text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto w-full max-w-4xl px-5 pt-6 pb-24">
        {/* top bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-5 dark:border-zinc-800">
          <a href="/" className="text-left">
            <div className="text-lg font-semibold tracking-tight">
              Legal Jobs<span className="text-zinc-400">.</span>
            </div>
            <div className="text-xs text-zinc-500">
              Legal roles from across the web, in one place
            </div>
          </a>
          <span className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-500 dark:border-zinc-800">
            {source === 'live'
              ? `Live · ${sources.join(' + ')}`
              : 'Sample data'}
          </span>
        </header>

        {source === 'sample' && (
          <p className="mt-6 rounded-lg border border-dashed border-zinc-300 px-4 py-3 text-xs leading-relaxed text-zinc-500 dark:border-zinc-700">
            Live boards weren’t reachable, so these are representative sample
            roles linking to each company’s careers page. Live postings load
            automatically once a source responds.
          </p>
        )}

        {/* filters */}
        <section className="mt-8 grid grid-cols-1 gap-3 border-y border-zinc-200 py-4 sm:grid-cols-3 dark:border-zinc-800">
          <label className="sm:col-span-2">
            <span className="sr-only">Search</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, company, location, or skill…"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="sr-only">Source board</span>
            <select
              value={board}
              onChange={(e) => setBoard(e.target.value)}
              className={`${inputClass} cursor-pointer appearance-none pr-8`}
            >
              <option value="any">All sources</option>
              {boards.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
        </section>

        <div className="py-4 text-sm text-zinc-500">
          {results.length} {results.length === 1 ? 'posting' : 'postings'}
          {withSalary > 0 && (
            <span className="text-zinc-400"> · {withSalary} with salary</span>
          )}
        </div>

        {/* list */}
        {results.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-500">No postings match that.</p>
            <button
              onClick={() => {
                setQ('')
                setBoard('any')
              }}
              className="mt-3 text-sm font-medium underline underline-offset-4"
              type="button"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {results.map((j) => (
              <JobRow key={j.id} job={j} />
            ))}
          </ul>
        )}

        <footer className="mt-12 border-t border-zinc-200 pt-6 text-xs leading-relaxed text-zinc-500 dark:border-zinc-800">
          Postings are aggregated from public job boards and shown with their
          original title, a short description, salary where the source lists it,
          and a link back to the original posting. Listings and salaries are the
          responsibility of the originating employer and board.
        </footer>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

const inputClass =
  'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100'

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
      {children}
    </span>
  )
}

function ExternalLinkIcon() {
  return (
    <svg
      viewBox="0 0 15 15"
      className="h-3.5 w-3.5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3.64645 11.3536C3.45118 11.1583 3.45118 10.8417 3.64645 10.6465L10.2929 4L6 4C5.72386 4 5.5 3.77614 5.5 3.5C5.5 3.22386 5.72386 3 6 3L11.5 3C11.6326 3 11.7598 3.05268 11.8536 3.14645C11.9473 3.24022 12 3.36739 12 3.5L12 9.00001C12 9.27615 11.7761 9.50001 11.5 9.50001C11.2239 9.50001 11 9.27615 11 9.00001V4.70711L4.35355 11.3536C4.15829 11.5488 3.84171 11.5488 3.64645 11.3536Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  )
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

function JobRow({ job }: { job: Job }) {
  const posted = relativeDate(job.postedAt)
  return (
    <li className="rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-medium">{job.title}</h3>
            {job.type && (
              <span className="hidden shrink-0 text-xs text-zinc-400 sm:inline">
                {job.type}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
            <span className="font-medium text-zinc-600 dark:text-zinc-400">
              {job.company}
            </span>
            {job.location && (
              <>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                <span>{job.location}</span>
              </>
            )}
            {posted && (
              <>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                <span>{posted}</span>
              </>
            )}
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <span className="text-zinc-400">{job.source}</span>
          </div>

          {job.description && (
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {job.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {job.salary && (
              <span className="inline-flex shrink-0 items-center rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-medium text-white dark:bg-white dark:text-zinc-900">
                {job.salary}
              </span>
            )}
            {job.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </div>

        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          View posting
          <ExternalLinkIcon />
        </a>
      </div>
    </li>
  )
}
