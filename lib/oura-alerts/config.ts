// Static configuration for the Oura Ring Promo demo alerts.
//
// Everything here is portal- or workspace-specific and verified against the
// live HubSpot portal (20853254) and the Spellbook Slack workspace. Secrets
// come from the environment instead; see env() below.

export const HUBSPOT_PORTAL_ID = '20853254'

// New business pipeline. Deal creation in this pipeline is the demo booking,
// and the stage on creation is "Opportunity Identified" (196326666), so nothing
// downstream should gate on a later stage.
export const NEW_BUSINESS_PIPELINE_ID = '109689417'

// The marketing tag that puts a contact in this campaign.
export const PROMO_TAG = 'Oura Ring Promo'

// Nick. Shadow-mode recipient, and the audit copy in live mode.
export const DEFAULT_SHADOW_RECIPIENT = 'U0BAPSYFLSV'

// How long a deal id stays in the dedupe store. Long enough to cover HubSpot's
// retry window and a redeploy, short enough that the store stays small.
export const DEDUPE_TTL_SECONDS = 60 * 60 * 24 * 4

// Active AEs and their Slack member ids. Anyone not on this list is printed as
// a plain name with no mention, because a wrong mention pings a real person.
export const AE_SLACK_IDS: Readonly<Record<string, string>> = {
  'Vasu Patel': 'U087XCSSZ6C',
  'Emily Aitken': 'U08DH1UFK38',
  'Scott Crowther': 'U0B7MMLENJ0',
  'Riley Giese': 'U0774L01QA1',
  'Ryan Salvador': 'U0B09C8E1J4',
  'Jordan Seward': 'U06T6FUV3FD',
  'Jordan Williams': 'U0B1GURS01G',
  'Hailey Doerr': 'U064ACGDWLE',
}

// Calendar titles carry a first name only ("... Meeting with Hailey"), and two
// active AEs are called Jordan, so a first name can resolve to more than one
// person. Callers have to handle the ambiguous case rather than guessing.
export const AE_BY_FIRST_NAME: Readonly<Record<string, readonly string[]>> =
  Object.entries(AE_SLACK_IDS).reduce<Record<string, string[]>>(
    (acc, [fullName]) => {
      const first = fullName.split(/\s+/)[0].toLowerCase()
      acc[first] = acc[first] ? [...acc[first], fullName] : [fullName]
      return acc
    },
    {},
  )

export function slackIdForName(fullName: string): string | null {
  const wanted = fullName.trim().toLowerCase()
  if (!wanted) return null
  for (const [name, id] of Object.entries(AE_SLACK_IDS)) {
    if (name.toLowerCase() === wanted) return id
  }
  return null
}

// Render a person as a Slack mention when we are certain who they are, and as a
// plain name otherwise.
export function mentionOrName(fullName: string): string {
  const id = slackIdForName(fullName)
  return id ? `<@${id}>` : fullName
}

export function dealUrl(dealId: string): string {
  return `https://app.hubspot.com/contacts/${HUBSPOT_PORTAL_ID}/record/0-3/${dealId}`
}

export type Env = {
  hubspotToken: string
  hubspotWebhookSecret: string
  anthropicApiKey: string
  slackBotToken: string
  shadowMode: boolean
  shadowRecipient: string
  // Set when the deployment sits behind a rewrite and request.url does not match
  // the URI HubSpot signed. Rare, but the signature is unforgiving about it.
  webhookUriOverride: string
}

// Read at call time rather than module load so tests can vary the environment.
export function env(): Env {
  return {
    hubspotToken: process.env.HUBSPOT_PRIVATE_APP_TOKEN ?? '',
    hubspotWebhookSecret: process.env.HUBSPOT_WEBHOOK_SECRET ?? '',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
    slackBotToken: process.env.SLACK_BOT_TOKEN ?? '',
    // Anything other than an explicit "false" keeps shadow mode on. Live sends
    // should take a deliberate act, not a typo in an env var.
    shadowMode: (process.env.SHADOW_MODE ?? 'true').toLowerCase() !== 'false',
    shadowRecipient: process.env.SHADOW_RECIPIENT || DEFAULT_SHADOW_RECIPIENT,
    webhookUriOverride: process.env.HUBSPOT_WEBHOOK_URI ?? '',
  }
}
