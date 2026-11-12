'use client'

import { useState } from 'react'
import { costPer, filterRange, groupSum, ratio, timeSeries } from '@/lib/aggregate'
import { fmtCount, fmtInt, fmtMoney, fmtPct } from '@/lib/format'
import { ga4TotalsRows, matchesChannel } from '@/lib/views'
import { TrendChart } from '../charts'
import { DataTable, type Column } from '../DataTable'
import { CHANNEL_OPTIONS, NotConnected, Section, Seg, useData, type Ga4Channel } from '../ui'

export function LandingPagesSection() {
  const { snapshot, currency } = useData()
  const { ads, ga4 } = snapshot
  const [channel, setChannel] = useState<Ga4Channel>('paid')
  return (
    <Section
      id="landing-pages"
      num={6}
      title="Landing pages"
      description="Where visitors land. Sessions and engagement come from GA4; ad clicks, spend and conversions come from the Google Ads landing page report."
    >
      {({ range, grouping }) => {
        if (!ads && !ga4) return <NotConnected source="GA4" />
        const gaSums = ga4
          ? groupSum(
              filterRange(ga4.daily.landingPages, range).filter((r) => matchesChannel(r.channel, channel)),
              (r) => r.path,
              ['sessions', 'engagedSessions', 'keyEvents'] as const,
            )
          : new Map()
        const adSums = ads
          ? groupSum(filterRange(ads.daily.landingPages, range), (r) => r.path, ['clicks', 'cost', 'conversions'] as const)
          : new Map()
        const paths = new Set<string>([...gaSums.keys(), ...adSums.keys()])
        const rows = [...paths].map((path) => {
          const g = gaSums.get(path)
          const a = adSums.get(path)
          return {
            path,
            sessions: g?.sessions ?? null,
            engagedSessions: g?.engagedSessions ?? null,
            engagementRate: g ? ratio(g.engagedSessions, g.sessions) : null,
            keyEvents: g?.keyEvents ?? null,
            keyEventRate: g ? ratio(g.keyEvents, g.sessions) : null,
            adClicks: a?.clicks ?? null,
            adCost: a?.cost ?? null,
            adConversions: a?.conversions ?? null,
            costPerConv: a ? costPer(a.cost, a.conversions) : null,
          }
        })
        const cols: Column<(typeof rows)[number]>[] = [
          { key: 'path', label: 'Page', render: (r) => <b>{r.path}</b> },
          ...(ga4
            ? ([
                { key: 'sessions', label: 'Sessions', num: true, render: (r) => fmtInt(r.sessions) },
                { key: 'engagedSessions', label: 'Engaged', num: true, render: (r) => fmtInt(r.engagedSessions) },
                { key: 'engagementRate', label: 'Engaged %', num: true, render: (r) => fmtPct(r.engagementRate, 0) },
                { key: 'keyEvents', label: 'GA4 key events', num: true, render: (r) => fmtInt(r.keyEvents) },
                { key: 'keyEventRate', label: 'Key event rate', num: true, render: (r) => fmtPct(r.keyEventRate) },
              ] as Column<(typeof rows)[number]>[])
            : []),
          ...(ads
            ? ([
                { key: 'adClicks', label: 'Ad clicks', num: true, render: (r) => fmtInt(r.adClicks) },
                { key: 'adCost', label: 'Ad spend', num: true, render: (r) => fmtMoney(r.adCost, currency) },
                { key: 'adConversions', label: 'Ad conv.', num: true, render: (r) => fmtCount(r.adConversions) },
                { key: 'costPerConv', label: 'Cost / conv.', num: true, render: (r) => fmtMoney(r.costPerConv, currency) },
              ] as Column<(typeof rows)[number]>[])
            : []),
        ]
        const series = ga4 ? timeSeries(ga4TotalsRows(ga4, channel), range, grouping, ['sessions', 'engagedSessions'] as const) : []
        return (
          <>
            <div className="filters">
              {ga4 && <Seg label="GA4 traffic" value={channel} options={CHANNEL_OPTIONS} onChange={setChannel} />}
            </div>
            {!ga4 && (
              <div style={{ marginBottom: 12 }}>
                <NotConnected source="GA4" detail="Sessions and engagement appear here once GA4 is connected. Google Ads landing page data is shown below." />
              </div>
            )}
            <DataTable rows={rows} columns={cols} rowKey={(r) => r.path} initialSort={{ key: ga4 ? 'sessions' : 'adClicks', dir: 'desc' }} caption="Landing pages" />
            {ga4 && (
              <TrendChart
                data={series}
                grouping={grouping}
                height={220}
                series={[
                  { key: 'sessions', label: 'Sessions', type: 'bar', color: '#8cc4f5', format: fmtInt },
                  { key: 'engagedSessions', label: 'Engaged sessions', type: 'line', color: '#0f6f96', format: fmtInt },
                ]}
              />
            )}
          </>
        )
      }}
    </Section>
  )
}
