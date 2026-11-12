'use client'

import { useState } from 'react'
import { ratio, timeSeries } from '@/lib/aggregate'
import { fmtInt, fmtPct } from '@/lib/format'
import { GA4_EVENTS } from '@/lib/privacy'
import { eventsByDay, ga4EventCounts, ga4EventRows, ga4Totals } from '@/lib/views'
import { COLORS, TrendChart } from '../charts'
import { DataTable, type Column } from '../DataTable'
import { EVENT_LABELS, KEY_EVENTS } from '../labels'
import { CHANNEL_OPTIONS, NotConnected, Section, Seg, useData, type Ga4Channel } from '../ui'

export function OnPageSection() {
  const { snapshot } = useData()
  const ga4 = snapshot.ga4
  const [channel, setChannel] = useState<Ga4Channel>('paid')
  return (
    <Section
      id="on-page"
      num={7}
      title="On-page actions"
      description="What visitors do on the site, from GA4 events. Rate per session is the event count divided by sessions in the same traffic group."
    >
      {({ range, grouping }) => {
        if (!ga4) {
          return <NotConnected source="GA4" detail={snapshot.sources.ga4.message ?? undefined} />
        }
        const totals = ga4Totals(ga4, range, channel)
        const counts = ga4EventCounts(ga4, range, channel)
        const rows = GA4_EVENTS.map((name) => ({
          name,
          label: EVENT_LABELS[name] ?? name,
          count: counts[name] ?? 0,
          rate: ratio(counts[name] ?? 0, totals.sessions),
        }))
        const cols: Column<(typeof rows)[number]>[] = [
          { key: 'label', label: 'Action', render: (r) => <><b>{r.label}</b><span className="cell-sub">{r.name}</span></> },
          { key: 'count', label: 'Count', num: true, render: (r) => fmtInt(r.count) },
          { key: 'rate', label: 'Per session', num: true, render: (r) => fmtPct(r.rate) },
        ]
        const series = timeSeries(eventsByDay(ga4EventRows(ga4, channel), KEY_EVENTS), range, grouping, [...KEY_EVENTS])
        return (
          <>
            <div className="filters">
              <Seg label="GA4 traffic" value={channel} options={CHANNEL_OPTIONS} onChange={setChannel} />
              <span className="chip">
                Sessions: <b>{fmtInt(totals.sessions)}</b>
              </span>
              <span className="chip">
                Engaged: <b>{fmtPct(ratio(totals.engagedSessions, totals.sessions), 0)}</b>
              </span>
            </div>
            <DataTable rows={rows} columns={cols} rowKey={(r) => r.name} initialSort={{ key: 'count', dir: 'desc' }} pageSize={20} caption="On-page actions" />
            <TrendChart
              data={series}
              grouping={grouping}
              series={KEY_EVENTS.map((name, i) => ({ key: name, label: EVENT_LABELS[name], type: 'line' as const, color: COLORS[i], format: fmtInt }))}
            />
          </>
        )
      }}
    </Section>
  )
}
