import { bucketKey, bucketsInRange, inRange, type Grouping } from './dates'
import type { DateRange } from './types'

type Numeric<T> = { [K in keyof T]: T[K] extends number | undefined ? K : never }[keyof T]

export function filterRange<T extends { date: string }>(rows: readonly T[], range: DateRange): T[] {
  return rows.filter((r) => inRange(r.date, range))
}

/** Sums the given numeric fields. Missing values count as zero. */
export function sumFields<T, K extends Numeric<T>>(rows: readonly T[], fields: readonly K[]): Record<K, number> {
  const out = {} as Record<K, number>
  for (const f of fields) out[f] = 0
  for (const row of rows) {
    for (const f of fields) out[f] += (row[f] as number | undefined) ?? 0
  }
  return out
}

/**
 * Groups rows by an entity key and sums numeric fields. Returns one entry per
 * key with the summed metrics, in first-seen order.
 */
export function groupSum<T, K extends Numeric<T>>(
  rows: readonly T[],
  keyOf: (row: T) => string,
  fields: readonly K[],
): Map<string, Record<K, number>> {
  const out = new Map<string, Record<K, number>>()
  for (const row of rows) {
    const key = keyOf(row)
    let acc = out.get(key)
    if (!acc) {
      acc = {} as Record<K, number>
      for (const f of fields) acc[f] = 0
      out.set(key, acc)
    }
    for (const f of fields) acc[f] += (row[f] as number | undefined) ?? 0
  }
  return out
}

export type SeriesPoint<K extends string> = { bucket: string } & Record<K, number>

/**
 * Daily rows to a time series for the range, bucketed by day, ISO week (Monday
 * start) or month. Buckets with no rows are filled with zeros. Partial first and
 * last weeks or months only include days inside the range.
 */
export function timeSeries<T extends { date: string }, K extends Numeric<T> & string>(
  rows: readonly T[],
  range: DateRange,
  grouping: Grouping,
  fields: readonly K[],
): SeriesPoint<K>[] {
  const sums = groupSum(filterRange(rows, range), (r) => bucketKey(r.date, grouping), fields)
  return bucketsInRange(range, grouping).map((bucket) => {
    const point = { bucket } as SeriesPoint<K>
    const s = sums.get(bucket)
    for (const f of fields) (point as Record<string, number | string>)[f] = s ? s[f] : 0
    return point
  })
}

/** Safe ratio: returns null instead of NaN or Infinity when the denominator is zero. */
export function ratio(numerator: number, denominator: number): number | null {
  if (!denominator) return null
  return numerator / denominator
}

export function ctr(clicks: number, impressions: number) {
  return ratio(clicks, impressions)
}

export function cpc(cost: number, clicks: number) {
  return ratio(cost, clicks)
}

export function costPer(cost: number, count: number) {
  return ratio(cost, count)
}

/** Relative change, or null when there is no previous value to compare against. */
export function delta(current: number, previous: number): number | null {
  if (!previous) return null
  return (current - previous) / previous
}
