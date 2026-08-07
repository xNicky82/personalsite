import { fetchJobs } from './jobs'
import { LegalJobsApp } from './legaljobs-app'

// Re-aggregate the boards at most hourly (matches the per-source fetch cache).
export const revalidate = 3600

// `?embed=1` renders a chrome-less version (no top nav / portfolio link) meant
// to be dropped into another site via an <iframe>, e.g. a Webflow Embed block.
export default async function LegalJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const embed = sp?.embed === '1' || sp?.embed === 'true'
  const { jobs, source } = await fetchJobs()
  return <LegalJobsApp jobs={jobs} source={source} embed={embed} />
}
