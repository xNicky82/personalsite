// Who is actually running the demo, and when.
//
// The person to notify is whoever hosts the call, which is not always the deal
// owner. The only reliable source in this portal is the deal-level
// hs_next_meeting_name / hs_next_meeting_start_time pair: meetings do not show
// up in the MEETING_EVENT object here, at least not through the standard
// connector. Both properties are currently labelled "Scheduled for
// Deletion/Archiving" in the portal, and if they are archived every alert
// degrades silently to "not on a calendar yet" rather than erroring, so the
// archive decision is worth chasing separately.
//
// This resolution is done in TypeScript rather than left to the model, because
// the Demo line is mechanical (string matching plus a timezone conversion) and
// it is the line an AE acts on. The model is handed the finished line.

import { AE_BY_FIRST_NAME, mentionOrName, slackIdForName } from './config'

export type DemoResolutionKind =
  | 'no-meeting'
  | 'lead-mismatch'
  | 'owner-hosting'
  | 'other-host'
  | 'ambiguous-host'
  | 'unknown-host'
  | 'no-title'

export type DemoResolution = {
  kind: DemoResolutionKind
  line: string
  // Slack id to send to in live mode, when we are certain of the host.
  hostSlackId: string | null
  hostName: string | null
  formattedTime: string | null
}

const ET = 'America/New_York'

// Eastern is the reporting timezone regardless of where the lead sits.
export function formatEastern(epochMs: number): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ET,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(new Date(epochMs))

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ''

  const period = get('dayPeriod').toLowerCase().replace(/\./g, '')
  return `${get('weekday')} ${get('month')} ${get('day')}, ${get('hour')}:${get('minute')}${period} ET`
}

// The brief describes these as epoch milliseconds, and the live portal returns
// ISO 8601 ("2026-09-10T17:30:00Z"). Accept both: reading this wrong does not
// error, it silently reports every booked demo as "not on a calendar yet".
export function parseMeetingStartMs(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null

  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : null
  }

  const raw = String(value).trim()
  if (!raw) return null

  if (/^\d+$/.test(raw)) {
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? n : null
  }

  const parsed = Date.parse(raw)
  return Number.isFinite(parsed) ? parsed : null
}

function stripPrefix(title: string): string {
  // Gong-recorded calls arrive prefixed "[Gong] ".
  return title.replace(/^\s*\[[^\]]*\]\s*/, '').trim()
}

// "Britt Killian <> Spellbook - Meeting with Hailey" -> "Hailey"
//
// Only the "Meeting with" shape is trusted. Titles in this portal also take
// freeform shapes ("[Gong] Sabrina & Marcus | Mondelez & Spellbook"), and
// guessing at the trailing word reads "Spellbook" as an AE.
export function hostFirstNameFromTitle(title: string): string {
  const clean = stripPrefix(title ?? '')
  if (!clean) return ''
  const withMatch = clean.match(/meeting with\s+([A-Za-z][A-Za-z'’-]*)/i)
  return withMatch ? withMatch[1] : ''
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// HubSpot links another person's meeting to a deal when two leads share an
// employer, so a title that names neither half of the lead's name is somebody
// else's demo.
export function titleNamesLead(
  title: string,
  first: string,
  last: string,
): boolean {
  const clean = stripPrefix(title ?? '')
  if (!clean) return false
  const candidates = [first, last].map((n) => (n ?? '').trim()).filter(Boolean)
  if (!candidates.length) return true
  return candidates.some((name) =>
    new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i').test(clean),
  )
}

function ownerLabel(dealOwner: string): string {
  return dealOwner?.trim() ? dealOwner.trim() : 'unassigned'
}

export function resolveDemo(input: {
  eventTitle: string
  startMs: number | null
  leadFirst: string
  leadLast: string
  dealOwner: string
}): DemoResolution {
  const { eventTitle, startMs, leadFirst, leadLast } = input
  const owner = ownerLabel(input.dealOwner)
  const title = stripPrefix(eventTitle ?? '')

  // No start time means the demo is not on a calendar yet, whatever else the
  // properties hold.
  if (startMs === null) {
    return {
      kind: 'no-meeting',
      line: `Demo: not on a calendar yet. Deal owner is ${mentionOrName(owner)}`,
      hostSlackId: null,
      hostName: null,
      formattedTime: null,
    }
  }

  const when = formatEastern(startMs)

  if (title && !titleNamesLead(title, leadFirst, leadLast)) {
    return {
      kind: 'lead-mismatch',
      line: `Demo: ⚠️ the meeting linked to this deal is "${title}", not this lead. Deal owner is ${mentionOrName(owner)}`,
      hostSlackId: null,
      hostName: null,
      formattedTime: when,
    }
  }

  if (!title) {
    return {
      kind: 'no-title',
      line: `Demo: ${when} ⚠️ the calendar event does not name a host, deal owner is ${mentionOrName(owner)}`,
      hostSlackId: null,
      hostName: null,
      formattedTime: when,
    }
  }

  const hostFirst = hostFirstNameFromTitle(title)
  const ownerFirst = owner.split(/\s+/)[0].toLowerCase()
  const matches = AE_BY_FIRST_NAME[hostFirst.toLowerCase()] ?? []

  // The owner's first name matching the host's is the normal case, and it is
  // also the only signal that disambiguates a shared first name, so it is
  // checked before the ambiguity rule below.
  if (hostFirst && ownerFirst === hostFirst.toLowerCase()) {
    return {
      kind: 'owner-hosting',
      line: `Demo: ${when} with ${mentionOrName(owner)}`,
      hostSlackId: slackIdForName(owner),
      hostName: owner,
      formattedTime: when,
    }
  }

  if (matches.length > 1) {
    // There really are two active AEs called Jordan, so a title that does not
    // agree with the owner cannot resolve the host and we must not guess at a
    // mention.
    return {
      kind: 'ambiguous-host',
      line: `Demo: ${when}, hosted by a ${hostFirst} ⚠️ two active AEs share that name, deal owner is ${owner}`,
      hostSlackId: null,
      hostName: null,
      formattedTime: when,
    }
  }

  if (matches.length === 0) {
    return {
      kind: 'unknown-host',
      line: hostFirst
        ? `Demo: ${when}, hosted by ${hostFirst} ⚠️ not a known AE, deal owner is ${owner}`
        : `Demo: ${when} ⚠️ the calendar event does not name a host, deal owner is ${mentionOrName(owner)}`,
      hostSlackId: null,
      hostName: hostFirst || null,
      formattedTime: when,
    }
  }

  // The demo is being run by someone other than the record owner, so mention
  // the host and name the owner after it.
  const hostName = matches[0]
  return {
    kind: 'other-host',
    line: `Demo: ${when} with ${mentionOrName(hostName)} ⚠️ deal owner is ${owner}`,
    hostSlackId: slackIdForName(hostName),
    hostName,
    formattedTime: when,
  }
}
