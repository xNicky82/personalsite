import { fetchJobs } from './jobs'
import { LegalJobsApp } from './legaljobs-app'

// Re-aggregate the boards at most hourly (matches the per-source fetch cache).
export const revalidate = 3600

// Note: `?embed=1` (chrome-less mode for the Webflow iframe) is detected on the
// client — reading it here via searchParams would force this page to render
// dynamically on every request, re-running all the board fetches and making the
// embed slow. Keeping it static lets the HTML be served straight from the edge.
export default async function LegalJobsPage() {
  const { jobs, source } = await fetchJobs()
  return <LegalJobsApp jobs={jobs} source={source} />
}
