import { describe, expect, it } from 'vitest'
import { displayName, nameParts } from '@/lib/oura-alerts/lead-name'

describe('displayName', () => {
  it('joins a clean first and last name', () => {
    expect(displayName('Lauren', 'Leonard')).toBe('Lauren Leonard')
  })

  // The promo form writes the full name into firstname, so these records are
  // real and the naive join prints the surname twice.
  it('does not repeat a surname the form already wrote into firstname', () => {
    expect(displayName('Zane Jones', 'Jones')).toBe('Zane Jones')
    expect(displayName('Thomas Farbacher', 'Farbacher')).toBe(
      'Thomas Farbacher',
    )
  })

  it('is case insensitive about the repetition', () => {
    expect(displayName('Zane JONES', 'Jones')).toBe('Zane JONES')
  })

  it('handles a missing half', () => {
    expect(displayName('Lauren', '')).toBe('Lauren')
    expect(displayName('', 'Leonard')).toBe('Leonard')
    expect(displayName('  ', '  ')).toBe('')
  })

  it('keeps a genuine multi-part surname', () => {
    expect(displayName('Ana', 'de la Cruz')).toBe('Ana de la Cruz')
    expect(displayName('Ana de la Cruz', 'de la Cruz')).toBe('Ana de la Cruz')
  })
})

describe('nameParts', () => {
  it('splits a clean record', () => {
    expect(nameParts('Lauren', 'Leonard')).toEqual({
      first: 'Lauren',
      last: 'Leonard',
    })
  })

  it('recovers the surname from a polluted firstname', () => {
    expect(nameParts('Zane Jones', '')).toEqual({
      first: 'Zane',
      last: 'Jones',
    })
  })
})
