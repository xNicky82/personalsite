// HubSpot read client for the promo alert flow.
//
// Two things worth knowing before editing this file. First, the contacts search
// endpoint does not support an `associations.deal` filter: it fails with "the
// app returned Error with no further details", so every hop from a deal to a
// contact or company goes through the v4 associations endpoints below. Second,
// the deal to company association is what HubSpot itself considers correct, so
// we use it rather than guessing an employer from the email domain.

import { env } from './config'

const BASE = 'https://api.hubapi.com'
const TIMEOUT_MS = 10_000

export type HubSpotObject = {
  id: string
  properties: Record<string, string | null>
}

export type Deal = {
  id: string
  name: string
  amount: string
  pipeline: string
  dealStage: string
  ownerId: string
  nextMeetingName: string
  nextMeetingStartMs: string
}

export type Contact = {
  id: string
  email: string
  firstname: string
  lastname: string
  jobtitle: string
  company: string
  marketingTags: string
  legalProfessionalAnswer: string
  country: string
}

export type Company = {
  id: string
  name: string
  domain: string
  industry: string
  description: string
  annualRevenue: string
  employees: string
  country: string
}

async function get<T>(path: string): Promise<T> {
  const token = env().hubspotToken
  if (!token) throw new Error('HUBSPOT_PRIVATE_APP_TOKEN is not set')

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: 'no-store',
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`HubSpot ${res.status} on ${path}: ${body.slice(0, 300)}`)
  }
  return (await res.json()) as T
}

function prop(o: HubSpotObject, key: string): string {
  return o.properties?.[key] ?? ''
}

const DEAL_PROPERTIES = [
  'dealname',
  'amount',
  'pipeline',
  'dealstage',
  'hubspot_owner_id',
  // Both of these are labelled "Scheduled for Deletion/Archiving" in this
  // portal and the whole Demo line depends on them.
  'hs_next_meeting_name',
  'hs_next_meeting_start_time',
].join(',')

export async function fetchDeal(dealId: string): Promise<Deal> {
  const o = await get<HubSpotObject>(
    `/crm/v3/objects/deals/${encodeURIComponent(dealId)}?properties=${DEAL_PROPERTIES}`,
  )
  return {
    id: o.id,
    name: prop(o, 'dealname'),
    amount: prop(o, 'amount'),
    pipeline: prop(o, 'pipeline'),
    dealStage: prop(o, 'dealstage'),
    ownerId: prop(o, 'hubspot_owner_id'),
    nextMeetingName: prop(o, 'hs_next_meeting_name'),
    nextMeetingStartMs: prop(o, 'hs_next_meeting_start_time'),
  }
}

type AssociationPage = { results?: Array<{ toObjectId?: number | string }> }

async function firstAssociatedId(
  dealId: string,
  toObjectType: 'contacts' | 'companies',
): Promise<string | null> {
  const page = await get<AssociationPage>(
    `/crm/v4/objects/deals/${encodeURIComponent(dealId)}/associations/${toObjectType}`,
  )
  const id = page.results?.[0]?.toObjectId
  return id === undefined || id === null ? null : String(id)
}

const CONTACT_PROPERTIES = [
  'email',
  'firstname',
  'lastname',
  'jobtitle',
  'company',
  'marketing_tags',
  'are_you_a_legal_professional',
  'country',
].join(',')

export async function fetchContactForDeal(
  dealId: string,
): Promise<Contact | null> {
  const contactId = await firstAssociatedId(dealId, 'contacts')
  if (!contactId) return null

  const o = await get<HubSpotObject>(
    `/crm/v3/objects/contacts/${contactId}?properties=${CONTACT_PROPERTIES}`,
  )
  return {
    id: o.id,
    email: prop(o, 'email'),
    firstname: prop(o, 'firstname'),
    lastname: prop(o, 'lastname'),
    jobtitle: prop(o, 'jobtitle'),
    company: prop(o, 'company'),
    marketingTags: prop(o, 'marketing_tags'),
    legalProfessionalAnswer: prop(o, 'are_you_a_legal_professional'),
    country: prop(o, 'country'),
  }
}

const COMPANY_PROPERTIES = [
  'name',
  'domain',
  'industry',
  // The single most useful field here: it is what establishes what the employer
  // actually does, so never drop it from this list.
  'description',
  'annualrevenue',
  'numberofemployees',
  'country',
].join(',')

export async function fetchCompanyForDeal(
  dealId: string,
): Promise<Company | null> {
  const companyId = await firstAssociatedId(dealId, 'companies')
  if (!companyId) return null

  const o = await get<HubSpotObject>(
    `/crm/v3/objects/companies/${companyId}?properties=${COMPANY_PROPERTIES}`,
  )
  return {
    id: o.id,
    name: prop(o, 'name'),
    domain: prop(o, 'domain'),
    industry: prop(o, 'industry'),
    description: prop(o, 'description'),
    annualRevenue: prop(o, 'annualrevenue'),
    employees: prop(o, 'numberofemployees'),
    country: prop(o, 'country'),
  }
}

// A missing owner, or a lookup that fails, means "unassigned". Never guess.
export async function fetchOwnerName(ownerId: string): Promise<string> {
  if (!ownerId) return ''
  try {
    const o = await get<{ firstName?: string; lastName?: string }>(
      `/crm/v3/owners/${encodeURIComponent(ownerId)}`,
    )
    return [o.firstName, o.lastName].filter(Boolean).join(' ').trim()
  } catch {
    return ''
  }
}

// marketing_tags is a multi-value property, so it arrives as a delimited string.
export function hasMarketingTag(marketingTags: string, tag: string): boolean {
  const wanted = tag.trim().toLowerCase()
  return (marketingTags ?? '')
    .split(/[;,]/)
    .map((t) => t.trim().toLowerCase())
    .some((t) => t === wanted)
}
