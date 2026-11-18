'use client'

import { useState } from 'react'
import { fmtCount, fmtInt, fmtMoney, fmtPct } from '@/lib/format'
import { buildConversionFunnel, type FunnelStep } from '@/lib/funnel'
import type { OverviewScope } from '@/lib/views'
import { DataTable, type Column } from '../DataTable'
import { CHANNEL_OPTIONS, NotConnected, Section, Seg, useData, type Ga4Channel } from '../ui'

const SCOPE_OPTIONS: { id: OverviewScope; label: string }[] = [
  { id: 'all', label: 'All campaigns' },
  { id: 'enabled', label: 'Enabled only' },
]

function Funnel({ steps, placeholder, currency, spend }: { steps: FunnelStep[]; placeholder: string; currency: string; spend: number | null }) {
  const max = Math.max(1, ...steps.map((s) => s.value ?? 0))
  // Log scale so later steps stay visible next to impressions.
  const width = (v: number) => 6 + 94 * (Math.log10(v + 1) / Math.log10(max + 1))
  return (
    <div className="funnel" role="list" aria-label="Conversion funnel">
      {steps.map((s) => (
        <div className={`funnel-row${s.branch ? ' branch' : ''}`} role="listitem" key={s.id}>
          <div className="funnel-label">
            {s.label}
            <small>{s.sub}</small>
          </div>
          <div className="funnel-track">
            {s.awaitingGa4 || s.value == null ? (
              <>
                <div className="funnel-bar off" style={{ width: '30%' }} />
                <span className="funnel-value">
                  <small>{s.source === 'ga4' ? 'GA4 not yet authorized' : '-'}</small>
                </span>
              </>
            ) : (
              <>
                <div className={`funnel-bar ${s.source}`} style={{ width: `${width(s.value) * 0.78}%` }} />
                <span className="funnel-value">
                  {s.id === 'primaryConversions' || s.id === 'secondaryConversions' ? fmtCount(s.value) : fmtInt(s.value)}
                  {s.rateFromPrevious != null && <small>{fmtPct(s.rateFromPrevious)} of previous</small>}
                  {s.costPer != null && <small>{fmtMoney(s.costPer, currency)} per</small>}
                  {s.detail && <small>{s.detail}</small>}
                </span>
              </>
            )}
          </div>
        </div>
      ))}
      {placeholder && (
        <p className="chart-legend-note" role="status">
          {placeholder}
        </p>
      )}
      {spend != null && (
        <p className="chart-legend-note">
          Cost per step is the selected campaign spend ({fmtMoney(spend, currency)}) divided by that step&apos;s count.
          Step-to-step rates skip side branches (phone clicks, Typeform, lead, secondary conversions and manual booked
          counts). GA4 and Ads count differently, so rates are a guide, not an exact match. Bar length uses a log scale
          so small steps stay visible.
        </p>
      )}
    </div>
  )
}

export function FunnelSection() {
  const { snapshot, offline, currency } = useData()
  const { ads, ga4 } = snapshot
  const [channel, setChannel] = useState<Ga4Channel>('paid')
  const [scope, setScope] = useState<OverviewScope>('all')

  return (
    <Section
      id="funnel"
      num={2}
      title="Conversion funnel"
      description="Ad impressions and clicks, then GA4 sessions, engagement and on-site events, then Ads conversions and any booked counts the clinic entered. Totals only, no patient details."
    >
      {({ range }) => {
        if (!ads && !ga4) return <NotConnected source="Google Ads" />
        const funnel = buildConversionFunnel({
          ads,
          ga4,
          ga4Status: snapshot.sources.ga4,
          offline,
          range,
          scope,
          channel,
        })
        const campaignCols: Column<(typeof funnel.campaigns)[number]>[] = [
          {
            key: 'name',
            label: 'Campaign',
            render: (r) => (
              <>
                <b>{r.name}</b>
                {r.status && <span className="cell-sub">{r.status}</span>}
              </>
            ),
          },
          { key: 'impressions', label: 'Impr.', num: true, render: (r) => fmtInt(r.impressions) },
          { key: 'clicks', label: 'Clicks', num: true, render: (r) => fmtInt(r.clicks) },
          { key: 'cost', label: 'Spend', num: true, render: (r) => fmtMoney(r.cost, currency) },
          { key: 'sessions', label: 'Sessions', num: true, render: (r) => fmtInt(r.sessions) },
          { key: 'engagedSessions', label: 'Engaged', num: true, render: (r) => fmtInt(r.engagedSessions) },
          { key: 'ctaClicks', label: 'CTA clicks', num: true, render: (r) => fmtInt(r.ctaClicks) },
          { key: 'phoneClicks', label: 'Phone clicks', num: true, render: (r) => fmtInt(r.phoneClicks) },
          { key: 'typeformStarts', label: 'Typeform starts', num: true, render: (r) => fmtInt(r.typeformStarts) },
          { key: 'typeformSubmits', label: 'Typeform submits', num: true, render: (r) => fmtInt(r.typeformSubmits) },
          { key: 'leads', label: 'Lead', num: true, render: (r) => fmtInt(r.leads) },
          { key: 'primaryConversions', label: 'Ads primary', num: true, render: (r) => fmtCount(r.primaryConversions) },
          { key: 'secondaryConversions', label: 'Ads secondary', num: true, render: (r) => fmtCount(r.secondaryConversions) },
        ]
        const pageCols: Column<(typeof funnel.landingPages)[number]>[] = [
          { key: 'path', label: 'Landing page', render: (r) => <b>{r.path}</b> },
          { key: 'adClicks', label: 'Ad clicks', num: true, render: (r) => fmtInt(r.adClicks) },
          { key: 'adCost', label: 'Ad spend', num: true, render: (r) => fmtMoney(r.adCost, currency) },
          { key: 'sessions', label: 'Sessions', num: true, render: (r) => fmtInt(r.sessions) },
          { key: 'engagedSessions', label: 'Engaged', num: true, render: (r) => fmtInt(r.engagedSessions) },
          { key: 'ctaClicks', label: 'CTA clicks', num: true, render: (r) => fmtInt(r.ctaClicks) },
          { key: 'phoneClicks', label: 'Phone clicks', num: true, render: (r) => fmtInt(r.phoneClicks) },
          { key: 'typeformStarts', label: 'Typeform starts', num: true, render: (r) => fmtInt(r.typeformStarts) },
          { key: 'typeformSubmits', label: 'Typeform submits', num: true, render: (r) => fmtInt(r.typeformSubmits) },
          { key: 'leads', label: 'Lead', num: true, render: (r) => fmtInt(r.leads) },
          { key: 'adConversions', label: 'Ad conv.', num: true, render: (r) => fmtCount(r.adConversions) },
        ]
        return (
          <>
            <div className="filters">
              <Seg label="Campaigns in the funnel" value={scope} options={SCOPE_OPTIONS} onChange={setScope} />
              <Seg label="GA4 traffic" value={channel} options={CHANNEL_OPTIONS} onChange={setChannel} />
            </div>
            {!funnel.ga4Ready && (
              <div style={{ marginBottom: 12 }}>
                <NotConnected source="GA4" detail={funnel.placeholder} />
              </div>
            )}
            <Funnel steps={funnel.steps} placeholder="" currency={currency} spend={funnel.spend} />
            <h3 className="subhead">By campaign</h3>
            {funnel.campaigns.length === 0 ? (
              <p className="chart-legend-note">No campaign rows in this range.</p>
            ) : (
              <DataTable
                rows={funnel.campaigns}
                columns={campaignCols}
                rowKey={(r) => r.key}
                initialSort={{ key: 'cost', dir: 'desc' }}
                caption="Conversion funnel by campaign"
              />
            )}
            {!funnel.ga4Ready && (
              <p className="chart-legend-note">
                Campaign sessions and on-site events fill in after GA4 is authorized. Ads primary on a campaign row is
                Google&apos;s Conversions column for that campaign. Secondary is all conversions minus that column.
              </p>
            )}
            {funnel.ga4Ready && (
              <p className="chart-legend-note">
                GA4 campaign rows match on campaign name. A row with no Ads spend is traffic GA4 attributed to a name
                that did not match an Ads campaign. Ads primary on a campaign row is Google&apos;s Conversions column for
                that campaign. Secondary is all conversions minus that column.
              </p>
            )}
            <h3 className="subhead">By landing page</h3>
            {funnel.landingPages.length === 0 ? (
              <p className="chart-legend-note">No landing page rows in this range.</p>
            ) : (
              <DataTable
                rows={funnel.landingPages}
                columns={pageCols}
                rowKey={(r) => r.path}
                initialSort={{ key: 'adCost', dir: 'desc' }}
                caption="Conversion funnel by landing page"
              />
            )}
          </>
        )
      }}
    </Section>
  )
}
