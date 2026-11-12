import type { DateRange } from './types'

export type Grouping = 'day' | 'week' | 'month'
export type RangePreset = '7d' | '30d' | '90d' | 'custom'

export const PRESET_DAYS: Record<Exclude<RangePreset, 'custom'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

const DAY_MS = 86_400_000

/** Dates are plain YYYY-MM-DD strings handled in UTC so time zones never shift a day. */
export function parseDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`)
}

export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function addDays(date: string, days: number): string {
  return formatDate(new Date(parseDate(date).getTime() + days * DAY_MS))
}

export function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const d = parseDate(date)
  return !Number.isNaN(d.getTime()) && formatDate(d) === date
}

export function daysBetween(start: string, end: string): number {
  return Math.round((parseDate(end).getTime() - parseDate(start).getTime()) / DAY_MS) + 1
}

/**
 * Resolves a preset to an inclusive range ending on `anchor` (normally the last
 * day with data). Custom ranges are normalized so start <= end.
 */
export function resolveRange(preset: RangePreset, anchor: string, custom?: Partial<DateRange>): DateRange {
  if (preset === 'custom') {
    const start = custom?.start && isValidDate(custom.start) ? custom.start : addDays(anchor, -29)
    const end = custom?.end && isValidDate(custom.end) ? custom.end : anchor
    return start <= end ? { start, end } : { start: end, end: start }
  }
  return { start: addDays(anchor, -(PRESET_DAYS[preset] - 1)), end: anchor }
}

/** The equally long range immediately before `range`, used for period-over-period deltas. */
export function previousRange(range: DateRange): DateRange {
  const len = daysBetween(range.start, range.end)
  return { start: addDays(range.start, -len), end: addDays(range.start, -1) }
}

export function inRange(date: string, range: DateRange): boolean {
  return date >= range.start && date <= range.end
}

/** Bucket key for a date: the day itself, the Monday of its ISO week, or the 1st of its month. */
export function bucketKey(date: string, grouping: Grouping): string {
  if (grouping === 'day') return date
  if (grouping === 'month') return `${date.slice(0, 7)}-01`
  const d = parseDate(date)
  const offset = (d.getUTCDay() + 6) % 7
  return addDays(date, -offset)
}

/** Every bucket key touching the range, in order, so charts show empty periods as zero. */
export function bucketsInRange(range: DateRange, grouping: Grouping): string[] {
  const keys: string[] = []
  let cursor = range.start
  while (cursor <= range.end) {
    const key = bucketKey(cursor, grouping)
    if (keys[keys.length - 1] !== key) keys.push(key)
    cursor = addDays(cursor, 1)
  }
  return keys
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function shortDate(date: string): string {
  const d = parseDate(date)
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`
}

export function bucketLabel(key: string, grouping: Grouping): string {
  if (grouping === 'month') {
    const d = parseDate(key)
    return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
  }
  if (grouping === 'week') return `Wk of ${shortDate(key)}`
  return shortDate(key)
}

export function rangeLabel(range: DateRange): string {
  const sameYear = range.start.slice(0, 4) === range.end.slice(0, 4)
  const start = shortDate(range.start) + (sameYear ? '' : `, ${range.start.slice(0, 4)}`)
  return `${start} - ${shortDate(range.end)}, ${range.end.slice(0, 4)}`
}
