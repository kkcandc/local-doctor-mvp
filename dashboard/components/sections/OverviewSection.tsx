'use client'

import { useState } from 'react'
import { delta, timeSeries } from '@/lib/aggregate'
import { bucketCoverage } from '@/lib/dates'
import { fmtCount, fmtInt, fmtMoney, fmtPct } from '@/lib/format'
import type { DateRange } from '@/lib/types'
import {
  conversionActionRows,
  overviewConversionRows,
  overviewCostPerPrimary,
  overviewMetricRows,
  overviewPrimaryCount,
  overviewTraffic,
  removedCampaignsInRange,
  type OverviewScope,
} from '@/lib/views'
import { MetricChart, type MetricPoint } from '../charts'
import { Kpi, NotConnected, Section, Seg, useData } from '../ui'

const SCOPE_OPTIONS: { id: OverviewScope; label: string }[] = [
  { id: 'all', label: 'All campaigns' },
  { id: 'enabled', label: 'Enabled only' },
]

function toPoints(rows: { bucket: string; value: number }[], range: DateRange, grouping: 'day' | 'week' | 'month'): MetricPoint[] {
  return rows.map((row) => ({ ...row, ...bucketCoverage(row.bucket, grouping, range) }))
}

function OverviewBody({ range, prevRange, grouping }: { range: DateRange; prevRange: DateRange | null; grouping: 'day' | 'week' | 'month' }) {
  const { snapshot, currency } = useData()
  const [scope, setScope] = useState<OverviewScope>('all')
  const { ads, ga4 } = snapshot
  if (!ads && !ga4) return <NotConnected source="Google Ads" />

  const t = ads ? overviewTraffic(ads, range, scope) : null
  const p = ads && prevRange ? overviewTraffic(ads, prevRange, scope) : null
  const d = (k: keyof NonNullable<typeof t>) => (t && p ? delta(Number(t[k] ?? 0), Number(p[k] ?? 0)) : null)
  const secondary = ads ? conversionActionRows(ads, range).filter((a) => !a.primary && a.count > 0).sort((a, b) => b.count - a.count) : []
  const primaryNow = ads ? overviewPrimaryCount(ads, range, scope) : 0
  const primaryPrev = ads && prevRange ? overviewPrimaryCount(ads, prevRange, scope) : null
  const costPerPrimary = ads ? overviewCostPerPrimary(ads, range, scope) : null
  const costPerPrimaryPrev = ads && prevRange ? overviewCostPerPrimary(ads, prevRange, scope) : null
  const removed = ads ? removedCampaignsInRange(ads, range) : []
  const callsNow = t?.phoneCalls ?? 0
  const callsPrev = p ? p.phoneCalls : null

  const trafficSeries = ads ? timeSeries(overviewMetricRows(ads, scope), range, grouping, ['cost', 'clicks'] as const) : []
  const primaryByBucket = ads ? timeSeries(overviewConversionRows(ads, scope), range, grouping, ['conversions'] as const) : []
  const spendPoints = toPoints(
    trafficSeries.map((point) => ({ bucket: point.bucket, value: point.cost })),
    range,
    grouping,
  )
  const clickPoints = toPoints(
    trafficSeries.map((point) => ({ bucket: point.bucket, value: point.clicks })),
    range,
    grouping,
  )
  const conversionPoints = toPoints(
    primaryByBucket.map((point) => ({ bucket: point.bucket, value: point.conversions })),
    range,
    grouping,
  )
  const anyPartial = spendPoints.some((point) => point.partial)

  return (
    <>
      {t ? (
        <div className="kpis">
          <Kpi label="Spend" value={fmtMoney(t.cost, currency)} delta={d('cost')} goodWhenUp={false} hint={scope === 'enabled' ? 'Enabled campaigns' : undefined} />
          <Kpi label="Impressions" value={fmtInt(t.impressions)} delta={d('impressions')} />
          <Kpi label="Clicks" value={fmtInt(t.clicks)} delta={d('clicks')} />
          <Kpi label="CTR" value={fmtPct(t.ctr)} delta={d('ctr')} />
          <Kpi label="Avg CPC" value={fmtMoney(t.cpc, currency)} delta={d('cpc')} goodWhenUp={false} />
          <Kpi
            label="Primary conversions"
            value={fmtCount(primaryNow)}
            delta={primaryPrev != null ? delta(primaryNow, primaryPrev) : null}
            hint={scope === 'enabled' ? 'Enabled campaigns' : 'Marked primary today'}
          />
          <Kpi
            label="Cost / primary conv."
            value={fmtMoney(costPerPrimary, currency)}
            delta={costPerPrimary != null && costPerPrimaryPrev != null ? delta(costPerPrimary, costPerPrimaryPrev) : null}
            goodWhenUp={false}
            hint={scope === 'enabled' ? 'Enabled campaigns' : undefined}
          />
          <Kpi
            label="Calls from ads"
            value={fmtInt(callsNow)}
            delta={callsPrev != null ? delta(callsNow, callsPrev) : null}
            hint={scope === 'enabled' ? 'Enabled campaigns' : 'Campaign call metrics'}
          />
        </div>
      ) : (
        <NotConnected source="Google Ads" />
      )}

      {secondary.length > 0 && (
        <>
          <h3 className="subhead">Secondary conversions (not used for bidding)</h3>
          <div className="chips">
            {secondary.map((a) => (
              <span className="chip" key={a.id}>
                {a.name}: <b>{fmtCount(a.count)}</b>
              </span>
            ))}
          </div>
        </>
      )}

      {ads && (
        <>
          <div className="section-head" style={{ marginTop: 8, marginBottom: 0 }}>
            <h3 className="subhead" style={{ margin: 0 }}>
              Trend
            </h3>
            <Seg label="Campaigns in the trend" value={scope} options={SCOPE_OPTIONS} onChange={setScope} />
          </div>
          {removed.length > 0 && (
            <p className="chart-note">
              {scope === 'enabled' ? 'Hidden by Enabled only. ' : 'Included in this range. '}
              {removed
                .map((c) => `${c.name} (removed): ${fmtInt(c.impressions)} impressions, ${fmtInt(c.clicks)} clicks, ${fmtMoney(c.cost, currency)}`)
                .join('; ')}
              .
            </p>
          )}
          <div className="chart-stack">
            <MetricChart title="Spend" data={spendPoints} color="#8cc4f5" grouping={grouping} format={(n) => fmtMoney(n, currency, 0)} showAxis={false} allowDecimals />
            <MetricChart title="Clicks" data={clickPoints} color="#0f3f8c" grouping={grouping} format={fmtInt} showAxis={false} />
            <MetricChart title="Primary conversions" data={conversionPoints} color="#e0a800" grouping={grouping} format={fmtCount} height={120} allowDecimals />
          </div>
          {anyPartial && <p className="chart-legend-note">Lighter bars are partial weeks or months. The range starts or ends in the middle of that bucket. Hover a bar for the exact days and value.</p>}
          {scope === 'enabled' && (
            <p className="chart-legend-note">Spend, clicks, primary conversions and cost per conversion are enabled campaigns only.</p>
          )}
        </>
      )}

      <p className="chart-legend-note">
        The conversion funnel, with step-to-step rates, cost per step, and breakdowns by campaign and landing page, is
        in the next section.
      </p>
    </>
  )
}

export function OverviewSection() {
  return (
    <Section id="overview" num={1} title="Overview" description="Spend, clicks and primary conversions are separate charts, each with its own scale. Primary conversions add up actions marked primary today. Calls from ads are campaign call metrics, not a conversion action.">
      {(ctx) => <OverviewBody {...ctx} />}
    </Section>
  )
}
