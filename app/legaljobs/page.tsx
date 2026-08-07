import { fetchJobs } from './jobs'
import { LegalJobsApp } from './legaljobs-app'

// Re-aggregate the boards at most hourly (matches the per-source fetch cache).
export const revalidate = 3600

export default async function LegalJobsPage() {
  const { jobs, source, sources } = await fetchJobs()
  return <LegalJobsApp jobs={jobs} source={source} sources={sources} />
}
