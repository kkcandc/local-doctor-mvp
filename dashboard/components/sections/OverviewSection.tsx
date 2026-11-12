'use client'

import { useState } from 'react'
import { costPer, delta, timeSeries } from '@/lib/aggregate'
import { fmtCount, fmtInt, fmtMoney, fmtPct } from '@/lib/format'
import type { DateRange } from '@/lib/types'
import { accountTotals, callsFromAds, conversionActionRows, ga4EventCounts, ga4Totals, primaryConversionCount, primaryConversionsByDate } from '@/lib/views'
import { TrendChart } from '../charts'
import { CHANNEL_OPTIONS, Kpi, NotConnected, Section, Seg, useData, type Ga4Channel } from '../ui'

interface Step {
  label: string
  sub: string
  value: number | null
  source: 'ads' | 'ga4'
  detail?: string
  /** Side branch rather than a narrower step, so no step-to-step rate. */
  branch?: boolean
}

function Funnel({ steps }: { steps: Step[] }) {
  const max = Math.max(1, ...steps.map((s) => s.value ?? 0))
  // Log scale so later steps stay visible next to impressions.
  const width = (v: number) => 6 + 94 * (Math.log10(v + 1) / Math.log10(max + 1))
  const rates = steps.map((s, i) => {
    if (s.value == null || s.branch) return null
    const prev = steps
      .slice(0, i)
      .reverse()
      .find((p) => p.value != null && !p.branch)
    return prev?.value ? s.value / prev.value : null
  })
  return (
    <div className="funnel" role="list" aria-label="Marketing funnel">
      {steps.map((s, i) => {
        const rate = rates[i]
        return (
          <div className="funnel-row" role="listitem" key={s.label}>
            <div className="funnel-label">
              {s.label}
              <small>{s.sub}</small>
            </div>
            <div className="funnel-track">
              {s.value == null ? (
                <>
                  <div className="funnel-bar off" style={{ width: '30%' }} />
                  <span className="funnel-value">
                    <small>GA4 not connected yet</small>
                  </span>
                </>
              ) : (
                <>
                  <div className={`funnel-bar ${s.source === 'ga4' ? 'ga4' : ''}`} style={{ width: `${width(s.value) * 0.78}%` }} />
                  <span className="funnel-value">
                    {fmtInt(s.value)}
                    {rate != null && <small>{fmtPct(rate)} of previous</small>}
                    {s.detail && <small>{s.detail}</small>}
                  </span>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function OverviewBody({ range, prevRange, grouping }: { range: DateRange; prevRange: DateRange | null; grouping: 'day' | 'week' | 'month' }) {
  const { snapshot, currency } = useData()
  const [channel, setChannel] = useState<Ga4Channel>('paid')
  const { ads, ga4 } = snapshot

  if (!ads && !ga4) return <NotConnected source="Google Ads" />

  const t = ads ? accountTotals(ads, range) : null
  const p = ads && prevRange ? accountTotals(ads, prevRange) : null
  const d = (k: keyof NonNullable<typeof t>) => (t && p ? delta(Number(t[k] ?? 0), Number(p[k] ?? 0)) : null)
  const secondary = ads ? conversionActionRows(ads, range).filter((a) => !a.primary && a.count > 0).sort((a, b) => b.count - a.count) : []
  const primaryNow = ads ? primaryConversionCount(ads, range) : 0
  const primaryPrev = ads && prevRange ? primaryConversionCount(ads, prevRange) : null
  const costPerPrimary = t ? costPer(t.cost, primaryNow) : null
  const costPerPrimaryPrev = p && primaryPrev != null ? costPer(p.cost, primaryPrev) : null
  const callsNow = ads ? callsFromAds(ads, range) : 0
  const callsPrev = ads && prevRange ? callsFromAds(ads, prevRange) : null

  const sessions = ga4 ? ga4Totals(ga4, range, channel) : null
  const events = ga4 ? ga4EventCounts(ga4, range, channel) : null
  const ev = (n: string) => (events ? events[n] ?? 0 : null)
  const onPage = events ? (ev('cta_click') ?? 0) + (ev('phone_tap') ?? 0) : null
  const submitted = events ? (ev('evaluation_submitted') ?? 0) + (ev('visit_booked') ?? 0) : null
  const adCalls = callsNow
  const calls = ads || events ? adCalls + (ev('phone_tap') ?? 0) : null

  const steps: Step[] = [
    { label: 'Impressions', sub: 'Google Ads', value: t?.impressions ?? null, source: 'ads' },
    { label: 'Clicks', sub: 'Google Ads', value: t?.clicks ?? null, source: 'ads' },
    { label: 'Landing page sessions', sub: `GA4, ${channel === 'paid' ? 'paid search' : 'all traffic'}`, value: sessions?.sessions ?? null, source: 'ga4' },
    { label: 'On-page actions', sub: 'GA4: CTA clicks and phone taps', value: onPage, source: 'ga4' },
    { label: 'Evaluation started', sub: 'GA4', value: ev('evaluation_started'), source: 'ga4' },
    {
      label: 'Evaluation submitted / booked',
      sub: 'GA4',
      value: submitted,
      source: 'ga4',
      detail: events ? `(${fmtInt(ev('evaluation_submitted'))} submitted, ${fmtInt(ev('visit_booked'))} booked)` : undefined,
    },
    {
      label: 'Calls',
      sub: 'Ad call button plus site phone taps',
      value: calls,
      source: 'ads',
      branch: true,
      detail: `(${fmtInt(adCalls)} from ads, ${events ? fmtInt(ev('phone_tap')) : 'GA4 n/a'} on site)`,
    },
  ]

  const spend = ads ? timeSeries(ads.daily.account, range, grouping, ['cost', 'clicks'] as const) : []
  const primaryByBucket = ads ? timeSeries(primaryConversionsByDate(ads), range, grouping, ['conversions'] as const) : []
  const series = spend.map((point, i) => ({ ...point, conversions: primaryByBucket[i]?.conversions ?? 0 }))

  return (
    <>
      {t ? (
        <div className="kpis">
          <Kpi label="Spend" value={fmtMoney(t.cost, currency)} delta={d('cost')} goodWhenUp={false} />
          <Kpi label="Impressions" value={fmtInt(t.impressions)} delta={d('impressions')} />
          <Kpi label="Clicks" value={fmtInt(t.clicks)} delta={d('clicks')} />
          <Kpi label="CTR" value={fmtPct(t.ctr)} delta={d('ctr')} />
          <Kpi label="Avg CPC" value={fmtMoney(t.cpc, currency)} delta={d('cpc')} goodWhenUp={false} />
          <Kpi label="Primary conversions" value={fmtCount(primaryNow)} delta={primaryPrev != null ? delta(primaryNow, primaryPrev) : null} hint="Marked primary today" />
          <Kpi
            label="Cost / primary conv."
            value={fmtMoney(costPerPrimary, currency)}
            delta={costPerPrimary != null && costPerPrimaryPrev != null ? delta(costPerPrimary, costPerPrimaryPrev) : null}
            goodWhenUp={false}
          />
          <Kpi label="Calls from ads" value={fmtInt(callsNow)} delta={callsPrev != null ? delta(callsNow, callsPrev) : null} hint="Campaign call metrics" />
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
        <TrendChart
          data={series}
          grouping={grouping}
          series={[
            { key: 'cost', label: 'Spend', type: 'bar', color: '#8cc4f5', format: (n) => fmtMoney(n, currency, 0) },
            { key: 'clicks', label: 'Clicks', type: 'line', axis: 'right', color: '#0f3f8c', format: fmtInt },
            { key: 'conversions', label: 'Primary conversions', type: 'line', axis: 'right', color: '#e0a800', format: fmtCount },
          ]}
        />
      )}

      <div className="section-head" style={{ marginTop: 24, marginBottom: 8 }}>
        <h3 className="subhead" style={{ margin: 0 }}>
          Funnel
        </h3>
        {ga4 && <Seg label="GA4 traffic" value={channel} options={CHANNEL_OPTIONS} onChange={setChannel} />}
      </div>
      <Funnel steps={steps} />
      <p className="chart-legend-note">
        Dark blue bars come from Google Ads, teal bars from GA4. Bar length uses a log scale so small steps stay
        visible. GA4 and Ads count differently, so step-to-step rates are a guide, not an exact match.
      </p>
    </>
  )
}

export function OverviewSection() {
  return (
    <Section id="overview" num={1} title="Overview" description="Spend, traffic and the funnel. Primary conversions add up actions marked primary today. Calls from ads are campaign call metrics, not a conversion action.">
      {(ctx) => <OverviewBody {...ctx} />}
    </Section>
  )
}
