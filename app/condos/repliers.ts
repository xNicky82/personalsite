// Server-side Repliers MLS adapter.
//
// This module reads REPLIERS_API_KEY from the environment and is only ever
// imported by the server component in page.tsx, so the key never reaches the
// browser. If the key is missing or the API is unreachable, we fall back to the
// curated SAMPLE_LISTINGS so the page always renders something useful.
//
// Concept → data mapping:
//   - Active leases  (status=A)          → available on the market right now
//   - Leased units   (lastStatus=Lsd)    → occupied; we estimate the next
//     opening as the lease-start date + 12 months (rolled forward to the next
//     anniversary if that date is already in the past). This is what powers the
//     "pre-offer before it lists" idea against real inventory.

import { SAMPLE_LISTINGS, type Listing } from './data'

const BASE = 'https://api.repliers.io/listings'
const DAY = 1000 * 60 * 60 * 24
const TIMEOUT_MS = 9000

type Raw = Record<string, unknown>

function asRecord(v: unknown): Raw {
  return v && typeof v === 'object' ? (v as Raw) : {}
}
function str(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v).trim()
}
function num(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(str(v).replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) ? n : 0
}
function int(v: unknown): number {
  return Math.round(num(v))
}

// Repliers sqft can be a number, a range like "700-799", or blank.
function parseSqft(v: unknown): number | null {
  const s = str(v)
  if (!s) return null
  const m = s.match(/\d+/)
  const n = m ? parseInt(m[0], 10) : NaN
  return Number.isFinite(n) && n > 0 ? n : null
}

// Derive a floor from a unit number when it looks like one (e.g. 1204 → 12).
function floorFromUnit(unit: string): number | null {
  if (/^\d{3,4}$/.test(unit)) {
    const f = Math.floor(parseInt(unit, 10) / 100)
    return f > 0 ? f : null
  }
  return null
}

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

function cleanBlurb(v: unknown): string {
  return str(v)
    .replace(/\s+/g, ' ')
    .replace(/\*+/g, '')
    .slice(0, 180)
    .trim()
}

function mapRaw(raw: Raw, nowMs: number, isActive: boolean): Listing | null {
  const address = asRecord(raw.address)
  const details = asRecord(raw.details)

  const rent = isActive ? num(raw.listPrice) : num(raw.soldPrice) || num(raw.listPrice)
  if (rent <= 0) return null

  const mls = str(raw.mlsNumber)
  const unit = str(address.unitNumber)
  const streetNumber = str(address.streetNumber)
  const streetName = str(address.streetName)
  const building =
    [streetNumber, streetName].filter(Boolean).join(' ') || 'Toronto condo'
  const neighborhood =
    str(address.neighborhood) || str(address.area) || str(address.city) || 'Toronto'

  const beds = int(details.numBedrooms)
  const baths = int(details.numBathrooms) || 1
  const sqft = parseSqft(details.sqft)
  const parking =
    int(details.numParkingSpaces) > 0 || int(details.numGarageSpaces) > 0
  const exposure = str(details.exposure)
  const view = exposure ? `${exposure} exposure` : null

  const blurbRaw = cleanBlurb(details.description)
  const blurb =
    blurbRaw ||
    `${beds === 0 ? 'Studio' : `${beds}-bed`} in ${neighborhood}${
      sqft ? `, ${sqft} sqft` : ''
    }.`

  let leaseEndMs: number
  if (isActive) {
    leaseEndMs = nowMs
  } else {
    const startStr = str(raw.soldDate) || str(raw.listDate)
    const start = startStr ? Date.parse(startStr) : NaN
    let end = Number.isFinite(start) ? start + 365 * DAY : nowMs + 180 * DAY
    // Roll forward to the next plausible renewal window if it's already past.
    let guard = 0
    while (end <= nowMs + 7 * DAY && guard < 6) {
      end += 365 * DAY
      guard++
    }
    leaseEndMs = end
  }

  const daysUntil = isActive ? 0 : Math.round((leaseEndMs - nowMs) / DAY)

  return {
    id: mls || `${building}-${unit}`.toLowerCase().replace(/\s+/g, '-'),
    building,
    neighborhood,
    unit: unit || '—',
    beds,
    baths,
    sqft,
    floor: floorFromUnit(unit),
    rent,
    leaseEnd: isoDate(leaseEndMs),
    daysUntil,
    available: isActive,
    parking,
    view,
    blurb,
    mls: mls || null,
    source: 'live',
  }
}

async function query(key: string, params: string): Promise<Raw[]> {
  const res = await fetch(`${BASE}?${params}`, {
    headers: { 'REPLIERS-API-KEY': key, 'content-type': 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    next: { revalidate: 1800 },
  })
  if (!res.ok) throw new Error(`Repliers responded ${res.status}`)
  const json = (await res.json()) as Raw
  const listings = json.listings
  return Array.isArray(listings) ? (listings as Raw[]) : []
}

export type FetchResult = {
  listings: Listing[]
  source: 'live' | 'sample'
}

export async function fetchListings(): Promise<FetchResult> {
  const key = process.env.REPLIERS_API_KEY
  if (!key) return { listings: SAMPLE_LISTINGS, source: 'sample' }

  try {
    const now = Date.now()

    // Leased units → estimated future availability. Retry without the city
    // filter if the (sandbox) dataset has nothing in Toronto.
    let leased = await query(key, 'type=lease&lastStatus=Lsd&city=Toronto&resultsPerPage=45')
    if (leased.length === 0) {
      leased = await query(key, 'type=lease&lastStatus=Lsd&resultsPerPage=45')
    }

    // Active leases → available now.
    let active = await query(key, 'type=lease&status=A&city=Toronto&resultsPerPage=15')
    if (active.length === 0) {
      active = await query(key, 'type=lease&status=A&resultsPerPage=15')
    }

    const mapped = [
      ...active.map((r) => mapRaw(r, now, true)),
      ...leased.map((r) => mapRaw(r, now, false)),
    ].filter((l): l is Listing => l !== null)

    // De-dupe by id, preferring the first occurrence (active over leased).
    const seen = new Set<string>()
    const listings: Listing[] = []
    for (const l of mapped) {
      if (seen.has(l.id)) continue
      seen.add(l.id)
      listings.push(l)
    }

    if (listings.length === 0) return { listings: SAMPLE_LISTINGS, source: 'sample' }
    return { listings, source: 'live' }
  } catch {
    // Network error, bad key, timeout, unexpected shape — degrade gracefully.
    return { listings: SAMPLE_LISTINGS, source: 'sample' }
  }
}
