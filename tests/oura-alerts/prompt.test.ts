import { describe, expect, it } from 'vitest'
import { buildGradingPrompt, type LeadData } from '@/lib/oura-alerts/prompt'
import { hasMarketingTag } from '@/lib/oura-alerts/hubspot'

const lead: LeadData = {
  displayName: 'Zane Jones',
  firstname: 'Zane Jones',
  lastname: 'Jones',
  jobTitle: '',
  email: 'zane@geodesicllp.com',
  country: '',
  legalProfessionalAnswer: 'Yes, in-house legal',
  companyName: 'Geodesic LLP',
  employees: '',
  annualRevenue: '',
  industry: '',
  companyDescription: 'Geospatial analytics.',
  dealOwner: 'Vasu Patel',
  eventTitle: '',
  meetingStartMs: '',
  dealAmount: '7988',
  dealId: '1001',
  resolvedDemoLine: 'Demo: not on a calendar yet. Deal owner is <@U087XCSSZ6C>',
}

describe('buildGradingPrompt', () => {
  it('carries the resolved lines the model must print verbatim', () => {
    const prompt = buildGradingPrompt(lead)
    expect(prompt).toContain('Display name: Zane Jones')
    expect(prompt).toContain(
      'Resolved demo line: Demo: not on a calendar yet. Deal owner is <@U087XCSSZ6C>',
    )
  })

  it('gives the model the deal link rather than a placeholder', () => {
    expect(buildGradingPrompt(lead)).toContain(
      'Deal link: https://app.hubspot.com/contacts/20853254/record/0-3/1001',
    )
  })

  it('marks empty fields as blank instead of dropping the label', () => {
    const prompt = buildGradingPrompt(lead)
    expect(prompt).toContain('Job title: (blank)')
    expect(prompt).toContain('Employees: (blank)')
  })

  it('keeps the company description, which is what establishes the employer', () => {
    expect(buildGradingPrompt(lead)).toContain(
      'Company description: Geospatial analytics.',
    )
  })
})

describe('hasMarketingTag', () => {
  it('matches one tag among several', () => {
    expect(
      hasMarketingTag('Webinar Q3;Oura Ring Promo', 'Oura Ring Promo'),
    ).toBe(true)
    expect(hasMarketingTag('oura ring promo', 'Oura Ring Promo')).toBe(true)
  })

  it('does not match a longer tag that merely starts the same', () => {
    expect(hasMarketingTag('Oura Ring Promo 2025', 'Oura Ring Promo')).toBe(
      false,
    )
  })

  it('handles an empty property', () => {
    expect(hasMarketingTag('', 'Oura Ring Promo')).toBe(false)
  })
})
