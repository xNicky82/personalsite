import { fetchListings } from './repliers'
import { PrelistApp } from './prelist-app'

// Re-fetch from Repliers at most every 30 minutes (matches the fetch cache).
export const revalidate = 1800

export default async function CondosPage() {
  const { listings, source } = await fetchListings()
  return <PrelistApp listings={listings} source={source} />
}
