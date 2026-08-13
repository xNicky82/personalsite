import type { Metadata } from 'next'
import { fetchJobDetail, type JobDetail } from '../jobs'

// Re-fetch a posting's detail at most hourly (matches the board fetch cache).
export const revalidate = 3600

const ACCENT = '#FF4716'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const job = await fetchJobDetail(slug)
  if (!job) return { title: 'Role not found — Legal Jobs' }
  return {
    title: `${job.title} at ${job.company} — Legal Jobs`,
    description: job.summary || `${job.title} at ${job.company}.`,
  }
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const job = await fetchJobDetail(slug)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black font-[family-name:var(--font-sohne)] text-white antialiased">
      <div className="mx-auto w-full max-w-3xl px-5 pt-8 pb-24">
        <a
          href="/legaljobs"
          className="inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
        >
          <span aria-hidden>←</span> Browse legal jobs
        </a>

        {job ? <Detail job={job} /> : <NotFound />}
      </div>
    </div>
  )
}

function Detail({ job }: { job: JobDetail }) {
  const posted = relativeDate(job.postedAt)
  return (
    <article className="mt-8">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/legaljobs/logo?domain=${encodeURIComponent(job.domain ?? '')}&name=${encodeURIComponent(job.company)}`}
            alt={`${job.company} logo`}
            width={48}
            height={48}
            className="h-full w-full object-contain"
          />
        </span>
        <div className="min-w-0">
          <div className="font-semibold">{job.company}</div>
          <div className="text-xs text-white/50">{job.source}</div>
        </div>
      </div>

      <h1 className="mt-6 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
        {job.title}
      </h1>

      {/* key facts */}
      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-white/60">
        {job.salary && (
          <span
            style={{ backgroundColor: ACCENT }}
            className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
          >
            {job.salary}
          </span>
        )}
        {job.location && <Fact>{job.location}</Fact>}
        {job.type && <Fact>{job.type}</Fact>}
        {posted && <Fact>{posted}</Fact>}
      </div>

      {/* summary */}
      {job.summary && (
        <div className="mt-8">
          <div className="text-xs font-medium tracking-wide text-white/40 uppercase">
            Summary
          </div>
          <p className="mt-2 leading-relaxed text-white/80">{job.summary}</p>
          <p className="mt-3 text-xs text-white/40">
            This is a short summary. Read the full role and requirements on{' '}
            {job.company}’s site.
          </p>
        </div>
      )}

      {/* actions */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ backgroundColor: ACCENT }}
          className="rounded-md px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Apply on {job.company}
        </a>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-white/20 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          View original posting
        </a>
      </div>

      <p className="mt-12 border-t border-white/10 pt-6 text-xs leading-relaxed text-white/40">
        This page summarizes a posting aggregated from {job.company}’s public
        careers site. The full description, requirements, and application live on
        the original posting.
      </p>
    </article>
  )
}

function Fact({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/20 px-2.5 py-0.5 text-xs font-medium text-white/70">
      {children}
    </span>
  )
}

function NotFound() {
  return (
    <div className="mt-16 rounded-xl border border-dashed border-white/20 py-16 text-center">
      <p className="text-lg font-semibold">This role may have closed.</p>
      <p className="mt-2 text-sm text-white/60">
        The posting couldn’t be found — it may have been filled or taken down.
      </p>
      <a
        href="/legaljobs"
        className="mt-4 inline-block text-sm font-medium underline underline-offset-4"
      >
        Back to all legal jobs
      </a>
    </div>
  )
}

function relativeDate(iso: string | null): string | null {
  if (!iso) return null
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return null
  const days = Math.round((Date.now() - t) / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'Posted today'
  if (days === 1) return 'Posted yesterday'
  if (days < 7) return `Posted ${days}d ago`
  if (days < 30) return `Posted ${Math.round(days / 7)}w ago`
  if (days < 365) return `Posted ${Math.round(days / 30)}mo ago`
  return `Posted ${Math.round(days / 365)}y ago`
}
