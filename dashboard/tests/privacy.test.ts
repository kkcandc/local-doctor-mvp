import { describe, expect, it } from 'vitest'
import { validateEntry } from '../lib/offline'
import { checkNote, pathOnly } from '../lib/privacy'

describe('pathOnly', () => {
  it('drops host, query string and fragment (gclid, utm, anything)', () => {
    expect(pathOnly('https://trylocaldoctor.com/dementia-evaluation?gclid=abc&utm_source=g#x')).toBe('/dementia-evaluation')
    expect(pathOnly('/evaluation/?gbraid=1')).toBe('/evaluation')
    expect(pathOnly('https://trylocaldoctor.com')).toBe('/')
    expect(pathOnly('')).toBe('(not set)')
  })
})

describe('offline note guard', () => {
  it('accepts general notes', () => {
    expect(checkNote('Phones busy after 3pm, holiday Monday')).toEqual({ ok: true, note: 'Phones busy after 3pm, holiday Monday' })
    expect(checkNote('  ')).toEqual({ ok: true, note: undefined })
  })

  it('rejects text that looks like contact details or birth dates', () => {
    expect(checkNote('call back jane@example.com').ok).toBe(false)
    expect(checkNote('call (410) 555-0123').ok).toBe(false)
    expect(checkNote('dob 3/14/1950').ok).toBe(false)
    expect(checkNote('x'.repeat(281)).ok).toBe(false)
  })
})

describe('offline entry validation', () => {
  it('accepts counts only and drops unknown fields', () => {
    const r = validateEntry({ date: '2026-11-10', phoneLeads: '3', bookedPatients: 1, note: '', ...{ name: 'x' } } as never, '2026-11-12')
    expect(r).toEqual({ ok: true, entry: { date: '2026-11-10', phoneLeads: 3, bookedPatients: 1 } })
  })

  it('rejects bad dates, future dates and non-integer counts', () => {
    expect(validateEntry({ date: '2026-13-01', phoneLeads: 1, bookedPatients: 1 }, '2026-11-12').ok).toBe(false)
    expect(validateEntry({ date: '2026-11-13', phoneLeads: 1, bookedPatients: 1 }, '2026-11-12').ok).toBe(false)
    expect(validateEntry({ date: '2026-11-10', phoneLeads: 1.5, bookedPatients: 1 }, '2026-11-12').ok).toBe(false)
    expect(validateEntry({ date: '2026-11-10', phoneLeads: -1, bookedPatients: 1 }, '2026-11-12').ok).toBe(false)
  })
})
