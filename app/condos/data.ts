// Off-market condo dataset for the pre-offer tool.
//
// The whole idea: unlike a normal listings site that only shows you units in
// the ~30 days before a lease is up, here every unit is visible with its
// *estimated* availability (when the current lease ends). You can register a
// pre-offer on a unit long before it ever hits the open market.
//
// Availability is computed from `leaseEnd` relative to a fixed reference date
// so the numbers are deterministic (no hydration drift) and match the story.

export const TODAY = new Date('2026-07-28T00:00:00')

export type Listing = {
  id: string
  building: string
  neighborhood: string
  unit: string
  beds: number // 0 = studio
  baths: number
  sqft: number
  floor: number
  rent: number // monthly CAD
  leaseEnd: string // ISO date the current lease ends
  parking: boolean
  pets: boolean
  view: string
  blurb: string
}

export const NEIGHBORHOODS = [
  'Liberty Village',
  'King West',
  'Yorkville',
  'Distillery District',
  'CityPlace',
  'Leslieville',
  'The Annex',
  'Financial District',
  'Fort York',
  'Queen West',
  'Yonge & Eglinton',
  'Harbourfront',
] as const

export const LISTINGS: Listing[] = [
  {
    id: 'lv-mode-1204',
    building: 'The Mode',
    neighborhood: 'Liberty Village',
    unit: '1204',
    beds: 1,
    baths: 1,
    sqft: 545,
    floor: 12,
    rent: 2550,
    leaseEnd: '2026-07-15',
    parking: false,
    pets: true,
    view: 'West / CN Tower',
    blurb: 'Bright corner 1-bed with floor-to-ceiling windows over Liberty.',
  },
  {
    id: 'lv-liberty-central-808',
    building: 'Liberty Central',
    neighborhood: 'Liberty Village',
    unit: '808',
    beds: 2,
    baths: 2,
    sqft: 820,
    floor: 8,
    rent: 3600,
    leaseEnd: '2026-09-30',
    parking: true,
    pets: true,
    view: 'Courtyard',
    blurb: 'Split 2-bed 2-bath, rare parking, steps from the GO.',
  },
  {
    id: 'kw-thompson-2201',
    building: 'Thompson Residences',
    neighborhood: 'King West',
    unit: '2201',
    beds: 1,
    baths: 1,
    sqft: 610,
    floor: 22,
    rent: 2950,
    leaseEnd: '2026-08-31',
    parking: false,
    pets: false,
    view: 'South / Lake',
    blurb: '1-bed + den in the heart of King West nightlife, rooftop pool.',
  },
  {
    id: 'kw-fashion-house-1710',
    building: 'Fashion House',
    neighborhood: 'King West',
    unit: '1710',
    beds: 0,
    baths: 1,
    sqft: 430,
    floor: 17,
    rent: 2200,
    leaseEnd: '2027-01-31',
    parking: false,
    pets: true,
    view: 'North',
    blurb: 'Efficient studio, exposed concrete, walk everywhere.',
  },
  {
    id: 'yk-1-bloor-4505',
    building: 'One Bloor East',
    neighborhood: 'Yorkville',
    unit: '4505',
    beds: 2,
    baths: 2,
    sqft: 910,
    floor: 45,
    rent: 5200,
    leaseEnd: '2026-11-15',
    parking: true,
    pets: false,
    view: 'East / Lake',
    blurb: 'High-floor 2-bed at Yonge & Bloor, direct subway access.',
  },
  {
    id: 'yk-museum-house-902',
    building: 'Museum House',
    neighborhood: 'Yorkville',
    unit: '902',
    beds: 3,
    baths: 3,
    sqft: 1720,
    floor: 9,
    rent: 8900,
    leaseEnd: '2027-03-31',
    parking: true,
    pets: true,
    view: 'ROM / Park',
    blurb: 'Boutique 3-bed overlooking the ROM, chef kitchen, 2 parking.',
  },
  {
    id: 'dd-gooderham-511',
    building: 'The Gooderham',
    neighborhood: 'Distillery District',
    unit: '511',
    beds: 1,
    baths: 1,
    sqft: 580,
    floor: 5,
    rent: 2700,
    leaseEnd: '2026-10-01',
    parking: false,
    pets: true,
    view: 'Cobblestone',
    blurb: 'Loft-style 1-bed in the Distillery, brick-and-beam character.',
  },
  {
    id: 'cp-parade-3308',
    building: 'Parade',
    neighborhood: 'CityPlace',
    unit: '3308',
    beds: 1,
    baths: 1,
    sqft: 560,
    floor: 33,
    rent: 2650,
    leaseEnd: '2026-07-01',
    parking: false,
    pets: true,
    view: 'South / Lake',
    blurb: 'Lake-view 1-bed above the CityPlace dog park, gym + pool.',
  },
  {
    id: 'cp-panorama-1102',
    building: 'Panorama',
    neighborhood: 'CityPlace',
    unit: '1102',
    beds: 2,
    baths: 2,
    sqft: 790,
    floor: 11,
    rent: 3450,
    leaseEnd: '2026-12-31',
    parking: true,
    pets: true,
    view: 'North / City',
    blurb: 'Family-friendly 2-bed, parking + locker, next to the Well.',
  },
  {
    id: 'le-sync-706',
    building: 'SYNC Lofts',
    neighborhood: 'Leslieville',
    unit: '706',
    beds: 1,
    baths: 1,
    sqft: 640,
    floor: 7,
    rent: 2600,
    leaseEnd: '2026-08-15',
    parking: false,
    pets: true,
    view: 'East',
    blurb: 'Hard loft with 10ft ceilings, walk to Queen East cafés.',
  },
  {
    id: 'an-annex-lofts-403',
    building: 'The Annex Lofts',
    neighborhood: 'The Annex',
    unit: '403',
    beds: 2,
    baths: 1,
    sqft: 880,
    floor: 4,
    rent: 3800,
    leaseEnd: '2027-02-28',
    parking: false,
    pets: true,
    view: 'Tree-lined',
    blurb: 'Character 2-bed loft near U of T and the subway.',
  },
  {
    id: 'fd-1-york-3901',
    building: '1 York',
    neighborhood: 'Financial District',
    unit: '3901',
    beds: 2,
    baths: 2,
    sqft: 950,
    floor: 39,
    rent: 5600,
    leaseEnd: '2026-09-15',
    parking: true,
    pets: false,
    view: 'Lake / Islands',
    blurb: 'Corner 2-bed on the waterfront edge of the core, PATH access.',
  },
  {
    id: 'fd-lstlawrence-1205',
    building: 'The Berczy',
    neighborhood: 'Financial District',
    unit: '1205',
    beds: 1,
    baths: 1,
    sqft: 600,
    floor: 12,
    rent: 2850,
    leaseEnd: '2027-05-31',
    parking: false,
    pets: true,
    view: 'St. Lawrence',
    blurb: '1-bed steps from St. Lawrence Market and Union.',
  },
  {
    id: 'fy-library-district-1808',
    building: 'Library District',
    neighborhood: 'Fort York',
    unit: '1808',
    beds: 1,
    baths: 1,
    sqft: 575,
    floor: 18,
    rent: 2500,
    leaseEnd: '2026-08-01',
    parking: false,
    pets: true,
    view: 'West',
    blurb: 'Quiet 1-bed by the Bentway, easy Gardiner + waterfront access.',
  },
  {
    id: 'qw-westside-509',
    building: 'Westside Gallery Lofts',
    neighborhood: 'Queen West',
    unit: '509',
    beds: 0,
    baths: 1,
    sqft: 490,
    floor: 5,
    rent: 2300,
    leaseEnd: '2026-10-31',
    parking: false,
    pets: true,
    view: 'Graffiti Alley',
    blurb: 'Artist studio-loft in the heart of West Queen West.',
  },
  {
    id: 'qw-bohemian-1201',
    building: 'Bohemian Embassy',
    neighborhood: 'Queen West',
    unit: '1201',
    beds: 2,
    baths: 2,
    sqft: 830,
    floor: 12,
    rent: 3700,
    leaseEnd: '2027-04-30',
    parking: true,
    pets: true,
    view: 'North / City',
    blurb: 'Bright 2-bed with a big terrace over Trinity Bellwoods.',
  },
  {
    id: 'ye-e-condos-3402',
    building: 'E Condos',
    neighborhood: 'Yonge & Eglinton',
    unit: '3402',
    beds: 1,
    baths: 1,
    sqft: 555,
    floor: 34,
    rent: 2750,
    leaseEnd: '2026-11-30',
    parking: false,
    pets: true,
    view: 'South / Skyline',
    blurb: 'High-floor 1-bed on the new Crosstown LRT.',
  },
  {
    id: 'ye-montgomery-1509',
    building: 'Montgomery Square',
    neighborhood: 'Yonge & Eglinton',
    unit: '1509',
    beds: 3,
    baths: 2,
    sqft: 1180,
    floor: 15,
    rent: 5400,
    leaseEnd: '2027-06-30',
    parking: true,
    pets: true,
    view: 'East',
    blurb: 'Rare midtown 3-bed for families, two parking spots.',
  },
  {
    id: 'hf-water-club-2607',
    building: 'Waterclub',
    neighborhood: 'Harbourfront',
    unit: '2607',
    beds: 2,
    baths: 2,
    sqft: 900,
    floor: 26,
    rent: 4100,
    leaseEnd: '2026-09-01',
    parking: true,
    pets: false,
    view: 'Direct Lake',
    blurb: 'Unobstructed lake-view 2-bed, resort-style amenities.',
  },
  {
    id: 'hf-pier-27-1004',
    building: 'Pier 27',
    neighborhood: 'Harbourfront',
    unit: '1004',
    beds: 1,
    baths: 1,
    sqft: 660,
    floor: 10,
    rent: 3100,
    leaseEnd: '2027-01-15',
    parking: true,
    pets: true,
    view: 'Marina',
    blurb: 'Glassy 1-bed + den right on the water at Yonge & Queens Quay.',
  },
]

// --- availability helpers ---------------------------------------------------

const MS_PER_DAY = 1000 * 60 * 60 * 24

export function daysUntilAvailable(listing: Listing): number {
  const end = new Date(listing.leaseEnd + 'T00:00:00')
  return Math.round((end.getTime() - TODAY.getTime()) / MS_PER_DAY)
}

export function monthsUntilAvailable(listing: Listing): number {
  return daysUntilAvailable(listing) / 30.4
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
  const days = daysUntilAvailable(listing)
  if (days <= 0) return 'Available now'
  const end = new Date(listing.leaseEnd + 'T00:00:00')
  return `Est. ${MONTHS[end.getMonth()]} ${end.getFullYear()}`
}

export function availabilityDetail(listing: Listing): string {
  const days = daysUntilAvailable(listing)
  if (days <= 0) return 'On the open market now'
  if (days < 45) return `Lease ends in ~${days} days`
  const months = Math.round(monthsUntilAvailable(listing))
  return `Lease ends in ~${months} month${months === 1 ? '' : 's'}`
}

export function bedsLabel(beds: number): string {
  return beds === 0 ? 'Studio' : `${beds} bed`
}

export function formatRent(rent: number): string {
  return '$' + rent.toLocaleString('en-CA')
}
