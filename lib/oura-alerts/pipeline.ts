// Orchestration for one deal.
//
// The filters run cheapest first, because the webhook fires on every new deal
// (roughly 160 a day, of which about half are promo tagged, arriving in bursts
// after campaign sends rather than evenly) and only a fraction of those should
// ever reach a model call: pipeline, then the dedupe store, then the marketing
// tag, and only then the enrichment and the grading.

import { NEW_BUSINESS_PIPELINE_ID, PROMO_TAG } from './config'
import { alreadyAlerted, markAlerted } from './dedupe'
import {
  fetchCompanyForDeal,
  fetchContactForDeal,
  fetchDeal,
  fetchOwnerName,
  hasMarketingTag,
} from './hubspot'
import { gradeLead } from './grade'
import { displayName, nameParts } from './lead-name'
import { parseMeetingStartMs, resolveDemo } from './meeting'
import type { LeadData } from './prompt'
import { deliver } from './slack'

// How long to wait before re-reading a deal that arrived with no meeting time.
// Long enough to lose the race with HubSpot's own write, short enough that the
// alert still reaches the AE well before the call.
// Read at call time so it can be tuned per environment (and driven to zero in
// tests) without a redeploy.
const meetingRecheckMs = () =>
  Number(process.env.OURA_MEETING_RECHECK_MS ?? 45_000)

const sleep = (ms: number) =>
  ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve()

export type Deps = {
  fetchDeal: typeof fetchDeal
  fetchContactForDeal: typeof fetchContactForDeal
  fetchCompanyForDeal: typeof fetchCompanyForDeal
  fetchOwnerName: typeof fetchOwnerName
  alreadyAlerted: typeof alreadyAlerted
  markAlerted: typeof markAlerted
  gradeLead: typeof gradeLead
  deliver: typeof deliver
}

export const defaultDeps: Deps = {
  fetchDeal,
  fetchContactForDeal,
  fetchCompanyForDeal,
  fetchOwnerName,
  alreadyAlerted,
  markAlerted,
  gradeLead,
  deliver,
}

export type Outcome =
  | { status: 'skipped'; dealId: string; reason: string }
  | { status: 'sent'; dealId: string; delivered: string[]; text: string }
  | { status: 'failed'; dealId: string; reason: string }

export async function processDeal(
  dealId: string,
  deps: Deps = defaultDeps,
): Promise<Outcome> {
  const deal = await deps.fetchDeal(dealId)

  if (deal.pipeline !== NEW_BUSINESS_PIPELINE_ID) {
    return { status: 'skipped', dealId, reason: `pipeline ${deal.pipeline}` }
  }

  if (await deps.alreadyAlerted(dealId)) {
    return { status: 'skipped', dealId, reason: 'already alerted' }
  }

  const contact = await deps.fetchContactForDeal(dealId)
  if (!contact) {
    return { status: 'skipped', dealId, reason: 'no associated contact' }
  }
  if (!hasMarketingTag(contact.marketingTags, PROMO_TAG)) {
    return { status: 'skipped', dealId, reason: 'not tagged for the promo' }
  }

  // Everything above here is cheap. Everything below costs money or latency.
  const [company, dealOwner] = await Promise.all([
    deps.fetchCompanyForDeal(dealId),
    deps.fetchOwnerName(deal.ownerId),
  ])

  // The webhook fires on deal.creation, and the meeting properties are written
  // by a separate process that can land seconds later, so a blank meeting time
  // on the first read is more often a race than a demo that is genuinely not
  // booked. Re-read once before believing it, because the wrong answer here is
  // silent: every alert would say "not on a calendar yet".
  let meetingName = deal.nextMeetingName
  let meetingStartMs = parseMeetingStartMs(deal.nextMeetingStartMs)
  if (meetingStartMs === null) {
    await sleep(meetingRecheckMs())
    const reread = await deps.fetchDeal(dealId)
    meetingName = reread.nextMeetingName
    meetingStartMs = parseMeetingStartMs(reread.nextMeetingStartMs)
  }

  const { first, last } = nameParts(contact.firstname, contact.lastname)
  const demo = resolveDemo({
    eventTitle: meetingName,
    startMs: meetingStartMs,
    leadFirst: first,
    leadLast: last,
    dealOwner,
  })

  const lead: LeadData = {
    displayName: displayName(contact.firstname, contact.lastname),
    firstname: contact.firstname,
    lastname: contact.lastname,
    jobTitle: contact.jobtitle,
    email: contact.email,
    country: contact.country || company?.country || '',
    legalProfessionalAnswer: contact.legalProfessionalAnswer,
    companyName: company?.name || contact.company || '',
    employees: company?.employees ?? '',
    annualRevenue: company?.annualRevenue ?? '',
    industry: company?.industry ?? '',
    companyDescription: company?.description ?? '',
    dealOwner,
    eventTitle: meetingName,
    meetingStartMs: String(meetingStartMs ?? ''),
    dealAmount: deal.amount,
    dealId: deal.id,
    resolvedDemoLine: demo.line,
  }

  const graded = await deps.gradeLead(lead)

  // A meeting that looks like it belongs to another lead is routed to a human
  // rather than announced to the AE whose name is on the calendar.
  const hostSlackId = demo.kind === 'lead-mismatch' ? null : demo.hostSlackId

  const { delivered, failures } = await deps.deliver(graded.text, hostSlackId)

  if (!delivered.length) {
    // Nothing was written to the dedupe store, so HubSpot's retry (or a manual
    // replay) gets another go at this lead.
    return {
      status: 'failed',
      dealId,
      reason:
        failures.map((f) => `${f.channel}: ${f.error}`).join('; ') ||
        'no recipients',
    }
  }

  await deps.markAlerted(dealId)
  return { status: 'sent', dealId, delivered, text: graded.text }
}
