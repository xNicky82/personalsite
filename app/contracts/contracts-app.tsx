'use client'

import { useMemo, useState } from 'react'
import { type Company, type Signatory, edgarFilingsUrl } from './data'

export function ContractsApp({
  companies,
  featured,
}: {
  companies: Company[]
  featured: Company
}) {
  const [q, setQ] = useState('')
  const [type, setType] = useState('any')
  const [open, setOpen] = useState<Set<string>>(new Set())

  const types = useMemo(
    () =>
      Array.from(new Set(companies.map((c) => c.contract.type))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [companies],
  )

  const results = useMemo(() => {
    const query = q.trim().toLowerCase()
    return companies.filter((c) => {
      if (
        query &&
        !`${c.name} ${c.ticker} ${c.contract.title} ${c.contract.type}`
          .toLowerCase()
          .includes(query)
      )
        return false
      if (type !== 'any' && c.contract.type !== type) return false
      return true
    })
  }, [companies, q, type])

  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white font-[family-name:var(--font-geist)] text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto w-full max-w-4xl px-5 pt-6 pb-24">
        {/* top bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-5 dark:border-zinc-800">
          <a href="/" className="text-left">
            <div className="text-lg font-semibold tracking-tight">
              EDGAR Contracts<span className="text-zinc-400">.</span>
            </div>
            <div className="text-xs text-zinc-500">
              A sample agreement from the 50 largest U.S. public companies
            </div>
          </a>
          <span className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-500 dark:border-zinc-800">
            Source: SEC EDGAR
          </span>
        </header>

        {/* featured example */}
        <FeaturedCard company={featured} className="mt-8" />

        {/* filters */}
        <section className="mt-8 grid grid-cols-1 gap-3 border-y border-zinc-200 py-4 sm:grid-cols-3 dark:border-zinc-800">
          <label className="sm:col-span-2">
            <span className="sr-only">Search</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search company, ticker, or contract type…"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="sr-only">Contract type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={`${inputClass} cursor-pointer appearance-none pr-8`}
            >
              <option value="any">All contract types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </section>

        <div className="py-4 text-sm text-zinc-500">
          {results.length} of {companies.length} compan
          {companies.length === 1 ? 'y' : 'ies'}
        </div>

        {/* list */}
        {results.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-500">No companies match that.</p>
            <button
              onClick={() => {
                setQ('')
                setType('any')
              }}
              className="mt-3 text-sm font-medium underline underline-offset-4"
              type="button"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {results.map((c) => (
              <CompanyRow
                key={c.ticker}
                company={c}
                open={open.has(c.ticker)}
                onToggle={() => toggle(c.ticker)}
              />
            ))}
          </ul>
        )}

        <footer className="mt-12 border-t border-zinc-200 pt-6 text-xs leading-relaxed text-zinc-500 dark:border-zinc-800">
          Rankings reflect the 2025 Fortune 500 (FY2024 revenue), limited to
          companies listed on a public U.S. market. Contracts and signatories
          are drawn from public SEC EDGAR filings; links open on sec.gov. Where
          a specific agreement hasn’t been pinned yet, the link opens the
          company’s EDGAR filing list instead.
        </footer>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

const inputClass =
  'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100'

function TypeBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
      {children}
    </span>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={[
        'h-4 w-4 shrink-0 text-zinc-400 transition-transform',
        open ? 'rotate-180' : '',
      ].join(' ')}
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

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 animate-spin"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth={3}
        className="opacity-25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </svg>
  )
}

// Fetches the server-rendered PDF and triggers a browser download, with a
// loading state (Chromium cold starts can take a few seconds) and inline error.
function DownloadPdfButton({ company }: { company: Company }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')

  async function download() {
    if (status === 'loading') return
    setStatus('loading')
    try {
      const res = await fetch(
        `/contracts/download?ticker=${encodeURIComponent(company.ticker)}`,
      )
      if (!res.ok) throw new Error(String(res.status))
      const blob = await res.blob()
      const href = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = href
      a.download = `${company.ticker}-${company.contract.type}`
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(href)
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={download}
        disabled={status === 'loading'}
        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        {status === 'loading' ? <Spinner /> : <DownloadIcon />}
        {status === 'loading' ? 'Preparing…' : 'Download PDF'}
      </button>
      {status === 'error' && (
        <span className="text-xs text-red-500">Couldn’t generate — try again</span>
      )}
    </span>
  )
}

function CompanyRow({
  company,
  open,
  onToggle,
}: {
  company: Company
  open: boolean
  onToggle: () => void
}) {
  return (
    <li className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
      >
        <span className="w-6 shrink-0 text-sm text-zinc-400 tabular-nums">
          {company.rank}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate font-medium">{company.name}</span>
            <span className="shrink-0 text-xs text-zinc-400">
              {company.ticker}
            </span>
          </span>
          <span className="mt-0.5 block truncate text-xs text-zinc-500">
            {company.contract.title}
          </span>
        </span>
        <TypeBadge>{company.contract.type}</TypeBadge>
        <Chevron open={open} />
      </button>

      {open && <ContractPanel company={company} />}
    </li>
  )
}

function ContractPanel({ company }: { company: Company }) {
  const { contract, signatories } = company
  return (
    <div className="grid gap-px border-t border-zinc-200 bg-zinc-200 md:grid-cols-[1.4fr_1fr] dark:border-zinc-800 dark:bg-zinc-800">
      {/* contract */}
      <div className="bg-white p-5 dark:bg-zinc-950">
        <div className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
          Contract
        </div>
        <h3 className="mt-1 leading-snug font-medium">{contract.title}</h3>

        <dl className="mt-4 space-y-1.5 text-sm">
          <Row k="Type" v={contract.type} />
          <Row k="Filed as" v={contract.filedAs} />
          <Row k="Filed" v={contract.filedDate} />
          <Row k="CIK" v={company.cik} />
        </dl>

        {contract.note && (
          <p className="mt-3 text-xs leading-relaxed text-zinc-500">
            {contract.note}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <a
            href={contract.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {contract.urlVerified ? 'Open contract on EDGAR' : 'Open on EDGAR'}
            <ExternalLinkIcon />
          </a>
          <DownloadPdfButton company={company} />
          <a
            href={edgarFilingsUrl(company.cik)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3.5 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            All filings
          </a>
        </div>

        {!contract.urlVerified && (
          <p className="mt-2 text-xs text-zinc-400">
            Opens the company’s EDGAR filing list — the specific agreement
            hasn’t been pinned yet.
          </p>
        )}
      </div>

      {/* signatories */}
      <div className="bg-white p-5 dark:bg-zinc-950">
        <div className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
          Signatories
        </div>
        <SignatoryList signatories={signatories} contractUrl={contract.url} />
      </div>
    </div>
  )
}

function SignatoryList({
  signatories,
  contractUrl,
}: {
  signatories: Signatory[]
  contractUrl: string
}) {
  if (signatories.length === 0) {
    return (
      <div className="mt-2">
        <p className="text-sm text-zinc-500">
          Not yet added. The signers are on the signature page of the filed
          agreement.
        </p>
        <a
          href={contractUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4"
        >
          View signature page on EDGAR
          <ExternalLinkIcon />
        </a>
      </div>
    )
  }

  return (
    <ul className="mt-3 space-y-3">
      {signatories.map((s, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
            {initials(s.name)}
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{s.name}</div>
            <div className="truncate text-xs text-zinc-500">{s.title}</div>
            {s.party && (
              <div className="truncate text-xs text-zinc-400">
                for {s.party}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

function FeaturedCard({
  company,
  className,
}: {
  company: Company
  className?: string
}) {
  const { contract } = company
  return (
    <section
      className={`rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40${className ? ` ${className}` : ''}`}
    >
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-medium text-white dark:bg-white dark:text-zinc-900">
          Featured example
        </span>
        <span className="text-xs text-zinc-400">
          {company.name} · {company.ticker}
        </span>
      </div>
      <h2 className="mt-3 leading-snug font-medium">{contract.title}</h2>
      {contract.note && (
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {contract.note}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <TypeBadge>{contract.type}</TypeBadge>
        <span className="text-xs text-zinc-400">
          {contract.filedAs} · {contract.filedDate}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <a
          href={contract.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Open on EDGAR
          <ExternalLinkIcon />
        </a>
        <DownloadPdfButton company={company} />
      </div>
    </section>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 text-zinc-400">{k}</dt>
      <dd className="text-right text-zinc-700 dark:text-zinc-300">{v}</dd>
    </div>
  )
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
