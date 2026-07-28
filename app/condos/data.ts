// Shared types + presentation helpers for the condo pre-offer tool.
//
// Listings come from two places:
//   - live   → Repliers MLS API (see repliers.ts), fetched server-side
//   - sample → the curated fallback below, used when no API key is set or the
//              API is unreachable
//
// Availability is expressed as `daysUntil` (days until the unit is estimated to
// open up) which is computed once when the listing is built — on the server for
// live data, against a fixed anchor for sample data. Rendering only ever reads
// that number, so there is no `Date.now()` in the render path and therefore no
// server/client hydration drift.

export type Source = 'live' | 'sample'

export type Listing = {
  id: string
  building: string
  neighborhood: string
  unit: string
  beds: number // 0 = studio
  baths: number
  sqft: number | null
  floor: number | null
  rent: number // monthly CAD
  leaseEnd: string // ISO date the unit is estimated to become available
  daysUntil: number // days from "now" to leaseEnd (<= 0 means available now)
  available: boolean // on the open market right now
  parking: boolean
  view: string | null
  blurb: string
  mls: string | null
  source: Source
}

// --- presentation helpers ---------------------------------------------------

export function daysUntilAvailable(listing: Listing): number {
  return listing.daysUntil
}

export function monthsUntilAvailable(listing: Listing): number {
  return listing.daysUntil / 30.4
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export function availabilityLabel(listing: Listing): string {
  if (listing.daysUntil <= 0) return 'Available now'
  const end = new Date(listing.leaseEnd + 'T00:00:00')
  if (Number.isNaN(end.getTime())) return 'Estimated soon'
  return `Est. ${MONTHS[end.getMonth()]} ${end.getFullYear()}`
}

export function availabilityDetail(listing: Listing): string {
  const days = listing.daysUntil
  if (days <= 0) return 'On the open market now'
  if (days < 45) return `Lease ends in ~${days} days`
  const months = Math.round(listing.daysUntil / 30.4)
  return `Lease ends in ~${months} month${months === 1 ? '' : 's'}`
}

// Fraction (0–1) of a fixed 12-month horizon at which the unit frees up.
export function horizonFraction(listing: Listing): number {
  const months = monthsUntilAvailable(listing)
  if (months <= 0) return 0
  if (months >= 12) return 1
  return months / 12
}

export function bedsLabel(beds: number): string {
  return beds === 0 ? 'Studio' : `${beds} bed`
}

export function formatRent(rent: number): string {
  return '$' + Math.round(rent).toLocaleString('en-CA')
}

// Stable pseudo-count of how many others have already registered interest in a
// unit. Derived from the id so it never shifts between renders or SSR/client.
export function interestCount(listing: Listing): number {
  let h = 0
  for (let i = 0; i < listing.id.length; i++) {
    h = (h * 31 + listing.id.charCodeAt(i)) & 0xffff
  }
  return 2 + (h % 12) // 2–13 others
}

// --- demo dataset -----------------------------------------------------------
//
// Used when there's no Repliers key or the API returns too little to feel real.
// It is SYNTHETIC — rents, unit mixes and lease histories are generated — but
// seeded from REAL Toronto condo buildings and their public addresses, and
// calibrated to realistic market rents. Generation is deterministic (seeded
// PRNG, no Math.random) and availability is expressed relative to a `nowMs`
// passed in by the server, so the data stays fresh without hydration drift.
// MLS numbers are intentionally null — these are not real listings.

const DAY = 1000 * 60 * 60 * 24

type Building = {
  name: string
  address: string
  neighborhood: string
  base: number // baseline 1-bed monthly rent for this building
  floors: number
  views: string[]
}

// Real Toronto condo buildings (public names + approximate addresses).
const BUILDINGS: Building[] = [
  { name: 'One Bloor East', address: '1 Bloor St E', neighborhood: 'Yorkville', base: 2950, floors: 75, views: ['East / Lake', 'City / South', 'North'] },
  { name: 'Casa III', address: '42 Charles St E', neighborhood: 'Yorkville', base: 2900, floors: 56, views: ['South / Skyline', 'West', 'East'] },
  { name: 'X Condos', address: '110 Charles St E', neighborhood: 'Yorkville', base: 2850, floors: 44, views: ['City', 'Park', 'South'] },
  { name: 'The Florian', address: '88 Davenport Rd', neighborhood: 'Yorkville', base: 3200, floors: 26, views: ['Rosedale', 'City', 'West'] },
  { name: 'Aura', address: '386 Yonge St', neighborhood: 'Downtown', base: 2650, floors: 78, views: ['City / South', 'North', 'West'] },
  { name: 'Ïce Condos', address: '12 York St', neighborhood: 'Financial District', base: 2800, floors: 67, views: ['Lake', 'CN Tower', 'City'] },
  { name: 'Maple Leaf Square', address: '55 Bremner Blvd', neighborhood: 'Financial District', base: 2850, floors: 54, views: ['Lake', 'Stadium', 'City'] },
  { name: 'Backstage', address: '21 Scott St', neighborhood: 'St. Lawrence', base: 2750, floors: 36, views: ['St. Lawrence', 'Lake', 'East'] },
  { name: 'The Berczy', address: '55 Front St E', neighborhood: 'St. Lawrence', base: 2700, floors: 13, views: ['St. Lawrence', 'Courtyard', 'City'] },
  { name: 'L Tower', address: '8 The Esplanade', neighborhood: 'St. Lawrence', base: 2900, floors: 58, views: ['Lake', 'City', 'East'] },
  { name: 'Bisha Residences', address: '80 Blue Jays Way', neighborhood: 'Entertainment District', base: 2900, floors: 44, views: ['CN Tower', 'City', 'South'] },
  { name: 'Festival Tower', address: '80 John St', neighborhood: 'Entertainment District', base: 2950, floors: 42, views: ['City', 'CN Tower', 'West'] },
  { name: 'Fashion House', address: '560 King St W', neighborhood: 'King West', base: 2750, floors: 15, views: ['North', 'City', 'South'] },
  { name: 'Charlie Condos', address: '8 Charlotte St', neighborhood: 'King West', base: 2800, floors: 34, views: ['South / Lake', 'City', 'West'] },
  { name: 'M5V', address: '375 King St W', neighborhood: 'King West', base: 2850, floors: 40, views: ['CN Tower', 'City', 'South'] },
  { name: 'Parade', address: '231 Fort York Blvd', neighborhood: 'CityPlace', base: 2550, floors: 40, views: ['South / Lake', 'North / City', 'West'] },
  { name: 'Spectra', address: '209 Fort York Blvd', neighborhood: 'CityPlace', base: 2500, floors: 39, views: ['Lake', 'City', 'Park'] },
  { name: 'Library District', address: '39 Queens Wharf Rd', neighborhood: 'CityPlace', base: 2550, floors: 26, views: ['West', 'Lake', 'City'] },
  { name: 'Liberty Central', address: '51 East Liberty St', neighborhood: 'Liberty Village', base: 2500, floors: 30, views: ['Courtyard', 'City', 'West'] },
  { name: 'Liberty Market Tower', address: '165 East Liberty St', neighborhood: 'Liberty Village', base: 2550, floors: 26, views: ['City', 'South', 'West'] },
  { name: 'Battery Park', address: '15 Western Battery Rd', neighborhood: 'Liberty Village', base: 2450, floors: 21, views: ['City', 'West', 'Courtyard'] },
  { name: 'Clear Spirit', address: '70 Distillery Lane', neighborhood: 'Distillery District', base: 2700, floors: 40, views: ['Distillery', 'Lake', 'City'] },
  { name: 'Pure Spirit', address: '68 Distillery Lane', neighborhood: 'Distillery District', base: 2650, floors: 31, views: ['Cobblestone', 'City', 'East'] },
  { name: 'Pier 27', address: '29 Queens Quay E', neighborhood: 'Harbourfront', base: 3000, floors: 35, views: ['Direct Lake', 'Marina', 'City'] },
  { name: 'Aqualina at Bayside', address: '261 Queens Quay E', neighborhood: 'Harbourfront', base: 2900, floors: 13, views: ['Lake', 'Marina', 'City'] },
  { name: 'Monde', address: '12 Bonnycastle St', neighborhood: 'Harbourfront', base: 2950, floors: 44, views: ['Lake', 'City', 'East'] },
  { name: 'Waterclub', address: '10 Navy Wharf Ct', neighborhood: 'Harbourfront', base: 2800, floors: 40, views: ['Lake', 'CN Tower', 'City'] },
  { name: 'Bohemian Embassy', address: '1171 Queen St W', neighborhood: 'Queen West', base: 2500, floors: 12, views: ['Trinity Bellwoods', 'North / City', 'West'] },
  { name: 'The Carnaby', address: '1245 Dupont St', neighborhood: 'Queen West', base: 2400, floors: 8, views: ['City', 'Courtyard', 'West'] },
  { name: 'Riverside Square', address: '90 Broadview Ave', neighborhood: 'Leslieville', base: 2450, floors: 27, views: ['Skyline', 'East', 'City'] },
  { name: 'The Taylor', address: '629 King St E', neighborhood: 'Leslieville', base: 2400, floors: 9, views: ['East', 'Courtyard', 'City'] },
  { name: 'E Condos', address: '8 Eglinton Ave E', neighborhood: 'Yonge & Eglinton', base: 2500, floors: 58, views: ['South / Skyline', 'North', 'East'] },
  { name: 'Art Shoppe Lofts', address: '2200 Yonge St', neighborhood: 'Yonge & Eglinton', base: 2550, floors: 39, views: ['City', 'South', 'West'] },
  { name: 'Bianca', address: '420 Dupont St', neighborhood: 'The Annex', base: 2600, floors: 9, views: ['Casa Loma', 'City', 'North'] },
  { name: 'Emerald Park', address: '4788 Yonge St', neighborhood: 'North York', base: 2300, floors: 44, views: ['City', 'North', 'East'] },
  { name: 'Hullmark Centre', address: '4789 Yonge St', neighborhood: 'North York', base: 2350, floors: 45, views: ['City', 'South', 'West'] },
]

// mulberry32 — deterministic PRNG so the dataset is identical on every render.
function mulberry32(seed: number) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function isoFromMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const BED_FACTOR = [0.82, 1, 1.42, 1.95] // studio, 1, 2, 3
const TYP_SQFT = [450, 590, 880, 1270]
const PARK_CHANCE = [0.1, 0.3, 0.6, 0.85]

const FEATURES = [
  'floor-to-ceiling windows',
  'a walk-out balcony',
  '9ft exposed-concrete ceilings',
  'a renovated kitchen',
  'ensuite laundry',
  'a private terrace',
  'integrated appliances',
  'a spa-inspired bath',
]

// Build the demo listings relative to `nowMs`. Deterministic given the seed.
export function buildDemoListings(nowMs: number): Listing[] {
  const rng = mulberry32(0x9e3779b9)
  const listings: Listing[] = []

  for (const b of BUILDINGS) {
    const unitsHere = 3 + Math.floor(rng() * 4) // 3–6 per building
    for (let i = 0; i < unitsHere; i++) {
      const r = rng()
      const beds = r < 0.12 ? 0 : r < 0.55 ? 1 : r < 0.85 ? 2 : 3
      const den = beds >= 1 && rng() < 0.3
      const baths = beds === 0 ? 1 : beds === 1 ? 1 : beds === 2 ? (rng() < 0.7 ? 2 : 1) : 2

      const sqftBase = [
        380 + rng() * 150,
        500 + rng() * 190,
        720 + rng() * 340,
        1050 + rng() * 470,
      ][beds]
      const sqft = Math.round(sqftBase / 5) * 5

      const floor = 2 + Math.floor(rng() * (b.floors - 2))
      const unitOnFloor = 1 + Math.floor(rng() * 8)
      const unit = `${floor}${String(unitOnFloor).padStart(2, '0')}`

      const sqftDelta = (sqft - TYP_SQFT[beds]) * 0.6
      const noise = rng() * 220 - 110
      const rent = Math.max(
        1800,
        Math.round((b.base * BED_FACTOR[beds] + sqftDelta + noise) / 25) * 25,
      )

      const parking = rng() < PARK_CHANCE[beds]
      const view = b.views[Math.floor(rng() * b.views.length)]

      // ~18% available now; the rest spread across the next 3 weeks–12 months.
      const av = rng()
      const offsetDays =
        av < 0.18 ? -Math.floor(rng() * 26) : 20 + Math.floor(rng() * 345)
      const leaseEndMs = nowMs + offsetDays * DAY

      const bedText = beds === 0 ? 'Studio' : `${beds}-bed${den ? ' + den' : ''}`
      const feature = FEATURES[Math.floor(rng() * FEATURES.length)]
      const blurb = `${bedText} at ${b.name} (${b.address}) in ${b.neighborhood}, with ${feature}.`

      listings.push({
        id: `${slug(b.name)}-${unit}`,
        building: b.name,
        neighborhood: b.neighborhood,
        unit,
        beds,
        baths,
        sqft,
        floor,
        rent,
        leaseEnd: isoFromMs(leaseEndMs),
        daysUntil: offsetDays,
        available: offsetDays <= 0,
        parking,
        view,
        blurb,
        mls: null,
        source: 'sample',
      })
    }
  }

  return listings
}
