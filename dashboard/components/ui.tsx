'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { addDays, previousRange, rangeLabel, resolveRange, type Grouping, type RangePreset } from '@/lib/dates'
import { fmtDelta } from '@/lib/format'
import type { DateRange, OfflineEntry, Snapshot } from '@/lib/types'

export interface DashboardData {
  snapshot: Snapshot
  offline: OfflineEntry[]
  /** True when the offline entries are made-up examples shown alongside the fixture. */
  offlineIsExample: boolean
  currency: string
  /** Last day with data. Presets end here. */
  anchor: string
  /** First day with data. */
  minDate: string
}

const DataContext = createContext<DashboardData | null>(null)
export const DataProvider = DataContext.Provider

export function useData(): DashboardData {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData outside DataProvider')
  return ctx
}

export interface SectionCtx {
  range: DateRange
  grouping: Grouping
  /** Same-length range just before, or null when the snapshot does not cover it. */
  prevRange: DateRange | null
}

const PRESETS: { id: RangePreset; label: string }[] = [
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: '90d', label: '90 days' },
  { id: 'custom', label: 'Custom' },
]

const GROUPINGS: { id: Grouping; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
]

const DEFAULT_GROUPING: Record<RangePreset, Grouping> = { '7d': 'day', '30d': 'day', '90d': 'week', custom: 'week' }

function clampRange(r: DateRange, min: string, max: string): DateRange {
  const start = r.start < min ? min : r.start > max ? max : r.start
  const end = r.end > max ? max : r.end < min ? min : r.end
  return { start, end }
}

export function Section({
  id,
  num,
  title,
  description,
  defaultPreset = '30d',
  showGrouping = true,
  anchor: anchorOverride,
  minDate: minDateOverride,
  children,
}: {
  id: string
  num: number
  title: string
  description?: ReactNode
  defaultPreset?: RangePreset
  showGrouping?: boolean
  /** Overrides the last selectable day, e.g. offline entries newer than the Ads data. */
  anchor?: string
  minDate?: string
  children: (ctx: SectionCtx) => ReactNode
}) {
  const data = useData()
  const anchor = anchorOverride ?? data.anchor
  const minDate = minDateOverride ?? data.minDate
  const [preset, setPreset] = useState<RangePreset>(defaultPreset)
  const [custom, setCustom] = useState<DateRange>(() => resolveRange('30d', anchor))
  const [grouping, setGrouping] = useState<Grouping>(DEFAULT_GROUPING[defaultPreset])

  const ctx = useMemo<SectionCtx>(() => {
    const range = clampRange(resolveRange(preset, anchor, custom), minDate, anchor)
    const prev = previousRange(range)
    return { range, grouping, prevRange: prev.start >= minDate ? prev : null }
  }, [preset, anchor, custom, minDate, grouping])

  return (
    <section className="section" id={id} aria-labelledby={`${id}-title`}>
      <div className="section-head">
        <div>
          <h2 className="section-title" id={`${id}-title`}>
            <span className="section-num">{num}</span>
            {title}
          </h2>
          {description && <p className="section-desc">{description}</p>}
        </div>
        <div className="controls">
          <div className="seg" role="group" aria-label={`${title} date range`}>
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={preset === p.id}
                onClick={() => {
                  setPreset(p.id)
                  setGrouping(DEFAULT_GROUPING[p.id])
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          {showGrouping && (
            <div className="seg" role="group" aria-label={`${title} grouping`}>
              {GROUPINGS.map((g) => (
                <button key={g.id} type="button" aria-pressed={grouping === g.id} onClick={() => setGrouping(g.id)}>
                  {g.label}
                </button>
              ))}
            </div>
          )}
          {preset === 'custom' && (
            <span className="custom-range">
              <label className="sr-only" htmlFor={`${id}-start`}>
                Start date
              </label>
              <input
                id={`${id}-start`}
                type="date"
                className="input input-date"
                min={minDate}
                max={anchor}
                value={custom.start}
                onChange={(e) => e.target.value && setCustom((c) => ({ ...c, start: e.target.value }))}
              />
              to
              <label className="sr-only" htmlFor={`${id}-end`}>
                End date
              </label>
              <input
                id={`${id}-end`}
                type="date"
                className="input input-date"
                min={minDate}
                max={anchor}
                value={custom.end}
                onChange={(e) => e.target.value && setCustom((c) => ({ ...c, end: e.target.value }))}
              />
            </span>
          )}
          <span className="range-caption">{rangeLabel(ctx.range)}</span>
        </div>
      </div>
      {children(ctx)}
    </section>
  )
}

export function Kpi({
  label,
  value,
  delta,
  goodWhenUp = true,
  hint,
}: {
  label: string
  value: string
  delta?: number | null
  goodWhenUp?: boolean
  hint?: string
}) {
  let cls = 'flat'
  if (delta != null && Math.abs(delta) >= 0.005) cls = delta > 0 === goodWhenUp ? 'up' : 'down'
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {delta != null ? (
        <div className={`kpi-delta ${cls}`}>{fmtDelta(delta)} vs previous period</div>
      ) : hint ? (
        <div className="kpi-hint">{hint}</div>
      ) : null}
    </div>
  )
}

export function NotConnected({ source, detail }: { source: 'Google Ads' | 'GA4'; detail?: string }) {
  return (
    <div className="not-connected" role="status">
      <h3>{source} not connected yet</h3>
      <p>{detail ?? `This section fills in once ${source} credentials are added and the next refresh runs.`}</p>
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase()
  const cls = s === 'ENABLED' ? 'badge-green' : s === 'REMOVED' ? 'badge-red' : 'badge-gray'
  const label = s ? s.charAt(0) + s.slice(1).toLowerCase() : '-'
  return <span className={`badge ${cls}`}>{label}</span>
}

export function Seg<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { id: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" aria-pressed={value === o.id} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export type Ga4Channel = 'paid' | 'all'
export const CHANNEL_OPTIONS: { id: Ga4Channel; label: string }[] = [
  { id: 'paid', label: 'Paid search' },
  { id: 'all', label: 'All traffic' },
]

export function lastDays(anchor: string, n: number): DateRange {
  return { start: addDays(anchor, -(n - 1)), end: anchor }
}
