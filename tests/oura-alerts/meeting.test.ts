import { describe, expect, it } from 'vitest'
import {
  formatEastern,
  hostFirstNameFromTitle,
  parseEpochMs,
  resolveDemo,
  titleNamesLead,
} from '@/lib/oura-alerts/meeting'

// Fri Sep 4 2026, 10:00am ET.
const FRI_10AM = 1788530400000
const FRI_11AM = 1788534000000

describe('formatEastern', () => {
  it('reports in Eastern regardless of where the lead sits', () => {
    expect(formatEastern(FRI_10AM)).toBe('Fri Sep 4, 10:00am ET')
  })
})

describe('parseEpochMs', () => {
  it('accepts the milliseconds HubSpot sends, as a number or a string', () => {
    expect(parseEpochMs(FRI_10AM)).toBe(FRI_10AM)
    expect(parseEpochMs(String(FRI_10AM))).toBe(FRI_10AM)
  })

  it('treats blank and nonsense as no meeting', () => {
    expect(parseEpochMs('')).toBeNull()
    expect(parseEpochMs(null)).toBeNull()
    expect(parseEpochMs(undefined)).toBeNull()
    expect(parseEpochMs('soon')).toBeNull()
  })
})

describe('hostFirstNameFromTitle', () => {
  it('reads the trailing AE first name', () => {
    expect(
      hostFirstNameFromTitle(
        'Britt Killian <> Spellbook - Meeting with Hailey',
      ),
    ).toBe('Hailey')
  })

  it('ignores the Gong prefix', () => {
    expect(
      hostFirstNameFromTitle(
        '[Gong] Britt Killian <> Spellbook - Meeting with Jordan',
      ),
    ).toBe('Jordan')
  })
})

describe('titleNamesLead', () => {
  it('matches on either half of the name', () => {
    const title = 'Britt Killian <> Spellbook - Meeting with Hailey'
    expect(titleNamesLead(title, 'Britt', 'Killian')).toBe(true)
    expect(titleNamesLead(title, 'Britt', '')).toBe(true)
    expect(titleNamesLead(title, '', 'Killian')).toBe(true)
  })

  it('does not match a substring inside another word', () => {
    expect(
      titleNamesLead(
        'Casey Duckworth <> Spellbook - Meeting with Jordan',
        'Ase',
        'Worth',
      ),
    ).toBe(false)
  })
})

describe('resolveDemo', () => {
  it('names the owner as host in the normal case', () => {
    const demo = resolveDemo({
      eventTitle: 'Britt Killian <> Spellbook - Meeting with Hailey',
      startMs: FRI_10AM,
      leadFirst: 'Britt',
      leadLast: 'Killian',
      dealOwner: 'Hailey Doerr',
    })
    expect(demo.kind).toBe('owner-hosting')
    expect(demo.line).toBe('Demo: Fri Sep 4, 10:00am ET with <@U064ACGDWLE>')
    expect(demo.hostSlackId).toBe('U064ACGDWLE')
  })

  it('flags a demo run by someone other than the record owner', () => {
    const demo = resolveDemo({
      eventTitle: 'Britt Killian <> Spellbook - Meeting with Riley',
      startMs: FRI_11AM,
      leadFirst: 'Britt',
      leadLast: 'Killian',
      dealOwner: 'Vasu Patel',
    })
    expect(demo.kind).toBe('other-host')
    expect(demo.line).toBe(
      'Demo: Fri Sep 4, 11:00am ET with <@U0774L01QA1> ⚠️ deal owner is Vasu Patel',
    )
  })

  it('refuses to guess when two active AEs share the host first name', () => {
    const demo = resolveDemo({
      eventTitle: 'Britt Killian <> Spellbook - Meeting with Jordan',
      startMs: FRI_11AM,
      leadFirst: 'Britt',
      leadLast: 'Killian',
      dealOwner: 'Vasu Patel',
    })
    expect(demo.kind).toBe('ambiguous-host')
    expect(demo.line).toBe(
      'Demo: Fri Sep 4, 11:00am ET, hosted by a Jordan ⚠️ two active AEs share that name, deal owner is Vasu Patel',
    )
    expect(demo.hostSlackId).toBeNull()
  })

  it('resolves a shared first name when it is the deal owner', () => {
    const demo = resolveDemo({
      eventTitle: 'Britt Killian <> Spellbook - Meeting with Jordan',
      startMs: FRI_11AM,
      leadFirst: 'Britt',
      leadLast: 'Killian',
      dealOwner: 'Jordan Seward',
    })
    expect(demo.kind).toBe('owner-hosting')
    expect(demo.hostSlackId).toBe('U06T6FUV3FD')
  })

  it("flags a meeting HubSpot linked from another lead's record", () => {
    const demo = resolveDemo({
      eventTitle: 'Casey Duckworth <> Spellbook - Meeting with Jordan',
      startMs: FRI_11AM,
      leadFirst: 'Britt',
      leadLast: 'Killian',
      dealOwner: 'Vasu Patel',
    })
    expect(demo.kind).toBe('lead-mismatch')
    expect(demo.line).toBe(
      'Demo: ⚠️ the meeting linked to this deal is "Casey Duckworth <> Spellbook - Meeting with Jordan", not this lead. Deal owner is <@U087XCSSZ6C>',
    )
    expect(demo.hostSlackId).toBeNull()
  })

  it('says the demo is not booked when there is no start time', () => {
    const demo = resolveDemo({
      eventTitle: '',
      startMs: null,
      leadFirst: 'Britt',
      leadLast: 'Killian',
      dealOwner: 'Vasu Patel',
    })
    expect(demo.kind).toBe('no-meeting')
    expect(demo.line).toBe(
      'Demo: not on a calendar yet. Deal owner is <@U087XCSSZ6C>',
    )
  })

  it('says unassigned rather than guessing an owner', () => {
    const demo = resolveDemo({
      eventTitle: '',
      startMs: null,
      leadFirst: 'Britt',
      leadLast: 'Killian',
      dealOwner: '',
    })
    expect(demo.line).toBe(
      'Demo: not on a calendar yet. Deal owner is unassigned',
    )
  })

  it('does not mention a host who is not a known AE', () => {
    const demo = resolveDemo({
      eventTitle: 'Britt Killian <> Spellbook - Meeting with Taylor',
      startMs: FRI_10AM,
      leadFirst: 'Britt',
      leadLast: 'Killian',
      dealOwner: 'Vasu Patel',
    })
    expect(demo.kind).toBe('unknown-host')
    expect(demo.line).not.toContain('<@')
    expect(demo.hostSlackId).toBeNull()
  })
})
