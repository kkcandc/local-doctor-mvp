'use client'

import { useState } from 'react'
import { costPer, filterRange, ratio } from '@/lib/aggregate'
import { bucketKey, bucketsInRange } from '@/lib/dates'
import { enumLabel, fmtCount, fmtInt, fmtMoney, fmtPct } from '@/lib/format'
import { accountTotals, conversionActionRows, ga4EventCounts, ga4Totals } from '@/lib/views'
import { COLORS, TrendChart } from '../charts'
import { DataTable, type Column } from '../DataTable'
import { EVENT_LABELS, GA4_CONVERSION_EVENTS } from '../labels'
import { CHANNEL_OPTIONS, NotConnected, Section, Seg, useData, type Ga4Channel } from '../ui'

export function ConversionsSection() {
  const { snapshot, currency } = useData()
  const { ads, ga4 } = snapshot
  const [channel, setChannel] = useState<Ga4Channel>('paid')
  return (
    <Section
      id="conversions"
      num={8}
      title="Conversions"
      description="Primary means the action is marked primary for the goal today. Every count is all conversions for that action, including ones Google leaves out of the Conversions column. Rate is the share of ad clicks (Ads) or sessions (GA4)."
    >
      {({ range, grouping }) => {
        if (!ads && !ga4) return <NotConnected source="Google Ads" />
        const actions = ads ? conversionActionRows(ads, range) : []
        const actionCols: Column<(typeof actions)[number]>[] = [
          { key: 'name', label: 'Conversion action', render: (r) => <><b>{r.name}</b><span className="cell-sub">{enumLabel(r.category)}</span></> },
          {
            key: 'primary',
            label: 'Type',
            value: (r) => (r.primary ? 0 : 1),
            render: (r) => <span className={`badge ${r.primary ? 'badge-blue' : 'badge-gray'}`}>{r.primary ? 'Primary' : 'Secondary'}</span>,
          },
          { key: 'count', label: 'Count', num: true, render: (r) => fmtCount(r.count) },
          { key: 'rateOfClicks', label: '% of clicks', num: true, render: (r) => fmtPct(r.rateOfClicks) },
          { key: 'costPerAction', label: 'Cost / action', num: true, render: (r) => fmtMoney(r.costPerAction, currency) },
        ]

        const primary = actions.filter((a) => a.primary && a.count > 0)
        const byBucket = new Map(bucketsInRange(range, grouping).map((b) => [b, { bucket: b } as Record<string, number | string>]))
        if (ads) {
          for (const r of filterRange(ads.daily.conversions, range)) {
            if (!primary.some((p) => p.id === r.conversionActionId)) continue
            const pt = byBucket.get(bucketKey(r.date, grouping))
            if (pt) pt[`a${r.conversionActionId}`] = ((pt[`a${r.conversionActionId}`] as number) ?? 0) + r.allConversions
          }
        }
        const chartData = [...byBucket.values()].map((p) => {
          for (const a of primary) p[`a${a.id}`] ??= 0
          return p
        })

        const sessions = ga4 ? ga4Totals(ga4, range, channel).sessions : 0
        const counts = ga4 ? ga4EventCounts(ga4, range, channel) : {}
        const cost = ads ? accountTotals(ads, range).cost : 0
        const gaRows = GA4_CONVERSION_EVENTS.map((name) => ({
          name,
          label: EVENT_LABELS[name],
          count: counts[name] ?? 0,
          rate: ratio(counts[name] ?? 0, sessions),
          costPer: channel === 'paid' && ads ? costPer(cost, counts[name] ?? 0) : null,
        }))
        const gaCols: Column<(typeof gaRows)[number]>[] = [
          { key: 'label', label: 'GA4 event', render: (r) => <><b>{r.label}</b><span className="cell-sub">{r.name}</span></> },
          { key: 'count', label: 'Count', num: true, render: (r) => fmtInt(r.count) },
          { key: 'rate', label: '% of sessions', num: true, render: (r) => fmtPct(r.rate) },
          { key: 'costPer', label: 'Ad cost / action', num: true, render: (r) => fmtMoney(r.costPer, currency) },
        ]

        return (
          <>
            {ads ? (
              <>
                <h3 className="subhead" style={{ marginTop: 0 }}>Google Ads conversion actions</h3>
                <DataTable rows={actions} columns={actionCols} rowKey={(r) => r.id} initialSort={{ key: 'primary', dir: 'asc' }} empty="No conversion actions found." caption="Conversion actions" />
                {primary.length > 0 && (
                  <TrendChart
                    data={chartData}
                    grouping={grouping}
                    height={220}
                    series={primary.map((a, i) => ({ key: `a${a.id}`, label: a.name, type: 'bar' as const, stack: 'conv', color: COLORS[i], format: fmtCount }))}
                  />
                )}
              </>
            ) : (
              <NotConnected source="Google Ads" />
            )}
            <div className="section-head" style={{ marginTop: 24, marginBottom: 10 }}>
              <h3 className="subhead" style={{ margin: 0 }}>GA4 conversion events</h3>
              {ga4 && <Seg label="GA4 traffic" value={channel} options={CHANNEL_OPTIONS} onChange={setChannel} />}
            </div>
            {ga4 ? (
              <>
                <DataTable rows={gaRows} columns={gaCols} rowKey={(r) => r.name} caption="GA4 conversion events" />
                {channel === 'all' && <p className="chart-legend-note">Ad cost per action is only shown for paid search traffic.</p>}
              </>
            ) : (
              <NotConnected source="GA4" />
            )}
          </>
        )
      }}
    </Section>
  )
}
