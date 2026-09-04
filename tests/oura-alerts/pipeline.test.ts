import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { processDeal, type Deps } from '@/lib/oura-alerts/pipeline'
import { deliver, recipients } from '@/lib/oura-alerts/slack'
import { NEW_BUSINESS_PIPELINE_ID } from '@/lib/oura-alerts/config'
import type { Company, Contact, Deal } from '@/lib/oura-alerts/hubspot'

const FRI_10AM = 1788530400000

function deal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: '1001',
    name: 'Britt Killian',
    amount: '7988',
    pipeline: NEW_BUSINESS_PIPELINE_ID,
    dealStage: '196326666',
    ownerId: '55',
    nextMeetingName: 'Britt Killian <> Spellbook - Meeting with Hailey',
    nextMeetingStartMs: String(FRI_10AM),
    ...overrides,
  }
}

function contact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: '2001',
    email: 'britt@example.com',
    firstname: 'Britt',
    lastname: 'Killian',
    jobtitle: 'General Counsel',
    company: 'Example Co',
    marketingTags: 'Webinar Q3;Oura Ring Promo',
    legalProfessionalAnswer: 'Yes, in-house legal',
    country: 'United States',
    ...overrides,
  }
}

function company(overrides: Partial<Company> = {}): Company {
  return {
    id: '3001',
    name: 'Example Co',
    domain: 'example.com',
    industry: 'COMPUTER_SOFTWARE',
    description: 'A software company.',
    annualRevenue: '80000000',
    employees: '400',
    country: 'United States',
    ...overrides,
  }
}

type Spies = {
  deps: Deps
  gradeCalls: number
  marked: string[]
  posted: Array<{ text: string; hostSlackId: string | null }>
}

function makeDeps(
  overrides: Partial<Deps> = {},
  alerted: string[] = [],
): Spies {
  const spies: Spies = {
    gradeCalls: 0,
    marked: [],
    posted: [],
    deps: {} as Deps,
  }

  spies.deps = {
    fetchDeal: async () => deal(),
    fetchContactForDeal: async () => contact(),
    fetchCompanyForDeal: async () => company(),
    fetchOwnerName: async () => 'Hailey Doerr',
    alreadyAlerted: async (id: string) => alerted.includes(id),
    markAlerted: async (id: string) => {
      spies.marked.push(id)
    },
    gradeLead: async () => {
      spies.gradeCalls += 1
      return { text: 'graded alert text', model: 'test-model' }
    },
    deliver: async (text: string, hostSlackId: string | null) => {
      spies.posted.push({ text, hostSlackId })
      return { delivered: ['U0BAPSYFLSV'], failures: [] }
    },
    ...overrides,
  }

  return spies
}

beforeEach(() => {
  process.env.SHADOW_MODE = 'true'
  process.env.SHADOW_RECIPIENT = 'U0BAPSYFLSV'
  process.env.SLACK_BOT_TOKEN = 'xoxb-test'
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('processDeal filtering', () => {
  it('drops a deal outside the new business pipeline before any lookup', async () => {
    const spies = makeDeps({
      fetchDeal: async () => deal({ pipeline: '999' }),
      fetchContactForDeal: async () => {
        throw new Error('should not fetch the contact')
      },
    })

    const outcome = await processDeal('1001', spies.deps)
    expect(outcome).toMatchObject({ status: 'skipped' })
    expect(spies.gradeCalls).toBe(0)
  })

  it('drops a deal whose contact does not carry the promo tag, before the model call', async () => {
    const spies = makeDeps({
      fetchContactForDeal: async () =>
        contact({ marketingTags: 'Webinar Q3;Newsletter' }),
      fetchCompanyForDeal: async () => {
        throw new Error('should not enrich a non-promo lead')
      },
    })

    const outcome = await processDeal('1001', spies.deps)
    expect(outcome).toMatchObject({
      status: 'skipped',
      reason: 'not tagged for the promo',
    })
    expect(spies.gradeCalls).toBe(0)
    expect(spies.posted).toHaveLength(0)
  })

  it('drops a deal already in the dedupe store', async () => {
    const spies = makeDeps({}, ['1001'])

    const outcome = await processDeal('1001', spies.deps)
    expect(outcome).toMatchObject({
      status: 'skipped',
      reason: 'already alerted',
    })
    expect(spies.gradeCalls).toBe(0)
    expect(spies.posted).toHaveLength(0)
  })

  it('matches the marketing tag among several, and is not fooled by a near miss', async () => {
    const tagged = makeDeps({
      fetchContactForDeal: async () =>
        contact({ marketingTags: 'Oura Ring Promo;Webinar Q3' }),
    })
    expect(await processDeal('1001', tagged.deps)).toMatchObject({
      status: 'sent',
    })

    const nearMiss = makeDeps({
      fetchContactForDeal: async () =>
        contact({ marketingTags: 'Oura Ring Promo 2025' }),
    })
    expect(await processDeal('1001', nearMiss.deps)).toMatchObject({
      status: 'skipped',
    })
  })
})

describe('processDeal delivery', () => {
  it('marks the deal only after a confirmed send', async () => {
    const spies = makeDeps()
    const outcome = await processDeal('1001', spies.deps)

    expect(outcome).toMatchObject({
      status: 'sent',
      delivered: ['U0BAPSYFLSV'],
    })
    expect(spies.marked).toEqual(['1001'])
  })

  it('leaves the dedupe store untouched when Slack fails, so the lead is retried', async () => {
    const spies = makeDeps({
      deliver: async () => ({
        delivered: [],
        failures: [{ channel: 'U0BAPSYFLSV', error: 'channel_not_found' }],
      }),
    })

    const outcome = await processDeal('1001', spies.deps)
    expect(outcome).toMatchObject({ status: 'failed' })
    expect(spies.marked).toEqual([])
  })

  it('routes a meeting linked from another lead to a human instead of the named AE', async () => {
    const spies = makeDeps({
      fetchDeal: async () =>
        deal({
          nextMeetingName: 'Casey Duckworth <> Spellbook - Meeting with Hailey',
        }),
    })

    await processDeal('1001', spies.deps)
    expect(spies.posted[0].hostSlackId).toBeNull()
  })

  it('hands the model a resolved demo line rather than raw meeting properties', async () => {
    let seenLine = ''
    const spies = makeDeps({
      fetchDeal: async () => deal({ nextMeetingStartMs: '' }),
      gradeLead: async (lead) => {
        seenLine = lead.resolvedDemoLine
        return { text: 'graded', model: 'test-model' }
      },
    })

    await processDeal('1001', spies.deps)
    expect(seenLine).toBe(
      'Demo: not on a calendar yet. Deal owner is <@U064ACGDWLE>',
    )
  })
})

describe('shadow mode', () => {
  it('never resolves a channel other than SHADOW_RECIPIENT', () => {
    process.env.SHADOW_MODE = 'true'
    expect(recipients('U0774L01QA1')).toEqual(['U0BAPSYFLSV'])
    expect(recipients(null)).toEqual(['U0BAPSYFLSV'])
  })

  it('posts only to SHADOW_RECIPIENT even when the host is known', async () => {
    const channels: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        channels.push(JSON.parse(String(init.body)).channel)
        return new Response(JSON.stringify({ ok: true }), { status: 200 })
      }),
    )

    await deliver('alert text', 'U0774L01QA1')
    expect(channels).toEqual(['U0BAPSYFLSV'])
  })

  it('copies the audit recipient alongside the host once live mode is switched on', () => {
    process.env.SHADOW_MODE = 'false'
    expect(recipients('U0774L01QA1')).toEqual(['U0774L01QA1', 'U0BAPSYFLSV'])
    // An unresolved host goes to a human to route by hand.
    expect(recipients(null)).toEqual(['U0BAPSYFLSV'])
  })
})
