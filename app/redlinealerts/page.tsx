import { fetchAlerts } from './alerts'
import { RedlineAlertsApp } from './redline-alerts-app'

// Re-aggregate the feeds at most every 5 minutes (matches the per-feed cache).
export const revalidate = 300

export default async function RedlineAlertsPage() {
  // A single server-side "now" seeds relative timestamps and the sample wire;
  // the client takes over the clock after mount so there's no hydration drift.
  const { alerts, source } = await fetchAlerts(Date.now())
  return <RedlineAlertsApp initialAlerts={alerts} source={source} />
}
