import { describe, expect, it } from 'vitest'
import { cpc, ctr, delta, filterRange, groupSum, ratio, sumFields, timeSeries } from '../lib/aggregate'
import { addDays, bucketCoverage, bucketEnd, bucketKey, bucketLabel, bucketsInRange, daysBetween, isValidDate, previousRange, resolveRange } from '../lib/dates'
import { spendRollup } from '../lib/views'
import exampleSnapshot from '../fixtures/example-snapshot.json'
import type { Snapshot } from '../lib/types'

const rows = [
  { date: '2026-10-30', clicks: 1, cost: 2 },
  { date: '2026-10-31', clicks: 2, cost: 4 },
  { date: '2026-11-01', clicks: 3, cost: 6 },
  { date: '2026-11-02', clicks: 4, cost: 8 },
  { date: '2026-11-09', clicks: 5, cost: 10 },
]

describe('date helpers', () => {
  it('validates real calendar dates only', () => {
    expect(isValidDate('2026-02-28')).toBe(true)
    expect(isValidDate('2026-02-30')).toBe(false)
    expect(isValidDate('2026-2-3')).toBe(false)
  })

  it('resolves presets as inclusive ranges ending on the anchor', () => {
    expect(resolveRange('7d', '2026-11-11')).toEqual({ start: '2026-11-05', end: '2026-11-11' })
    expect(resolveRange('30d', '2026-11-11')).toEqual({ start: '2026-10-13', end: '2026-11-11' })
    expect(daysBetween(...(Object.values(resolveRange('90d', '2026-11-11')) as [string, string]))).toBe(90)
  })

  it('normalizes a reversed custom range and falls back on invalid input', () => {
    expect(resolveRange('custom', '2026-11-11', { start: '2026-11-10', end: '2026-11-01' })).toEqual({ start: '2026-11-01', end: '2026-11-10' })
    expect(resolveRange('custom', '2026-11-11', { start: 'nope' })).toEqual({ start: '2026-10-13', end: '2026-11-11' })
  })

  it('computes the previous period of equal length', () => {
    expect(previousRange({ start: '2026-11-05', end: '2026-11-11' })).toEqual({ start: '2026-10-29', end: '2026-11-04' })
  })

  it('buckets by ISO week starting Monday, across a month boundary', () => {
    // 2026-11-01 is a Sunday, so it belongs to the week of Monday 2026-10-26.
    expect(bucketKey('2026-11-01', 'week')).toBe('2026-10-26')
    expect(bucketKey('2026-11-02', 'week')).toBe('2026-11-02')
    expect(bucketKey('2026-11-02', 'month')).toBe('2026-11-01')
    expect(bucketKey('2026-11-02', 'day')).toBe('2026-11-02')
  })

  it('handles year boundaries for weeks', () => {
    // 2027-01-01 is a Friday; its ISO week starts Monday 2026-12-28.
    expect(bucketKey('2027-01-01', 'week')).toBe('2026-12-28')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('lists every bucket in a range', () => {
    expect(bucketsInRange({ start: '2026-10-30', end: '2026-11-09' }, 'week')).toEqual(['2026-10-26', '2026-11-02', '2026-11-09'])
    expect(bucketsInRange({ start: '2026-10-30', end: '2026-11-09' }, 'month')).toEqual(['2026-10-01', '2026-11-01'])
    expect(bucketsInRange({ start: '2026-11-01', end: '2026-11-03' }, 'day')).toHaveLength(3)
  })

  it('labels buckets without any em dash', () => {
    expect(bucketLabel('2026-11-02', 'week')).toBe('Wk of Nov 2')
    expect(bucketLabel('2026-11-01', 'month')).toBe('Nov 2026')
  })
})

describe('aggregation', () => {
  it('filters to an inclusive range', () => {
    expect(filterRange(rows, { start: '2026-10-31', end: '2026-11-02' }).map((r) => r.clicks)).toEqual([2, 3, 4])
  })

  it('sums fields, treating missing values as zero', () => {
    expect(sumFields([{ a: 1, b: 2 }, { a: 3 } as { a: number; b?: number }], ['a', 'b'])).toEqual({ a: 4, b: 2 })
  })

  it('groups and sums by key', () => {
    const g = groupSum(rows, (r) => r.date.slice(0, 7), ['clicks'])
    expect(Object.fromEntries(g)).toEqual({ '2026-10': { clicks: 3 }, '2026-11': { clicks: 12 } })
  })

  it('builds a weekly series with partial weeks clipped to the range', () => {
    const s = timeSeries(rows, { start: '2026-10-31', end: '2026-11-09' }, 'week', ['clicks', 'cost'])
    expect(s).toEqual([
      { bucket: '2026-10-26', clicks: 5, cost: 10 },
      { bucket: '2026-11-02', clicks: 4, cost: 8 },
      { bucket: '2026-11-09', clicks: 5, cost: 10 },
    ])
  })

  it('marks only the first and last week or month buckets as partial', () => {
    const range = { start: '2026-10-31', end: '2026-11-09' }
    expect(bucketEnd('2026-10-26', 'week')).toBe('2026-11-01')
    expect(bucketEnd('2026-11-01', 'month')).toBe('2026-11-30')
    expect(bucketCoverage('2026-10-26', 'week', range)).toEqual({ coverStart: '2026-10-31', coverEnd: '2026-11-01', partial: true })
    expect(bucketCoverage('2026-11-02', 'week', range)).toEqual({ coverStart: '2026-11-02', coverEnd: '2026-11-08', partial: false })
    expect(bucketCoverage('2026-11-09', 'week', range)).toEqual({ coverStart: '2026-11-09', coverEnd: '2026-11-09', partial: true })
    expect(bucketCoverage('2026-10-01', 'month', { start: '2026-10-15', end: '2026-11-02' }).partial).toBe(true)
    expect(bucketCoverage('2026-11-03', 'day', range).partial).toBe(false)
  })

  it('fills empty buckets with zero', () => {
    const s = timeSeries(rows, { start: '2026-11-03', end: '2026-11-05' }, 'day', ['clicks'])
    expect(s.map((p) => p.clicks)).toEqual([0, 0, 0])
  })

  it('sums the same totals regardless of grouping', () => {
    const range = { start: '2026-10-01', end: '2026-11-30' }
    const total = (g: 'day' | 'week' | 'month') => timeSeries(rows, range, g, ['cost']).reduce((s, p) => s + p.cost, 0)
    expect(total('day')).toBe(30)
    expect(total('week')).toBe(30)
    expect(total('month')).toBe(30)
  })

  it('returns null for ratios with a zero denominator', () => {
    expect(ratio(1, 0)).toBeNull()
    expect(ctr(5, 100)).toBe(0.05)
    expect(cpc(10, 4)).toBe(2.5)
    expect(delta(12, 10)).toBeCloseTo(0.2)
    expect(delta(5, 0)).toBeNull()
  })
})

describe('fixture snapshot', () => {
  const snap = exampleSnapshot as unknown as Snapshot

  it('is clearly marked as example data', () => {
    expect(snap.isExample).toBe(true)
    expect(snap.ads?.campaigns.every((c) => c.name.startsWith('[Example]'))).toBe(true)
  })

  it('rolls up keyword, ad group and campaign spend to the account total', () => {
    const range = resolveRange('30d', snap.range.end)
    const root = spendRollup(snap.ads!, range)
    const campaignSum = root.children.reduce((s, c) => s + c.cost, 0)
    expect(campaignSum).toBeCloseTo(root.cost, 0)
    for (const c of root.children) {
      expect(c.children.reduce((s, g) => s + g.cost, 0)).toBeCloseTo(c.cost, 0)
      for (const g of c.children) {
        if (g.children.length) expect(g.children.reduce((s, k) => s + k.cost, 0)).toBeCloseTo(g.cost, 0)
      }
    }
  })
})
