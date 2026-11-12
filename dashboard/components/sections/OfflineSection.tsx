'use client'

import { filterRange, groupSum, ratio, sumFields } from '@/lib/aggregate'
import { bucketKey, bucketLabel, bucketsInRange, shortDate } from '@/lib/dates'
import { fmtCount, fmtInt } from '@/lib/format'
import { matchesChannel } from '@/lib/views'
import { TrendChart } from '../charts'
import { DataTable, type Column } from '../DataTable'
import { Kpi, Section, useData } from '../ui'

export function OfflineSection() {
  const { snapshot, offline, offlineIsExample, anchor, minDate } = useData()
  const { ads, ga4 } = snapshot
  const dates = offline.map((e) => e.date).sort()
  const lastEntry = dates[dates.length - 1]
  const firstEntry = dates[0]
  return (
    <Section
      id="offline"
      num={10}
      title="Offline leads"
      anchor={lastEntry && lastEntry > anchor ? lastEntry : anchor}
      minDate={firstEntry && firstEntry < minDate ? firstEntry : minDate}
      description={
        <>
          Phone leads and booked patients entered by the clinic team as daily counts, next to ad clicks and calls.{' '}
          <a href="/entry">Enter or edit numbers</a>.
          {offlineIsExample && <> These counts are example data until real numbers are entered.</>}
        </>
      }
    >
      {({ range, grouping }) => {
        const buckets = bucketsInRange(range, grouping)
        const entries = filterRange(offline, range)
        const off = groupSum(entries, (e) => bucketKey(e.date, grouping), ['phoneLeads', 'bookedPatients'] as const)
        const adSums = ads ? groupSum(filterRange(ads.daily.account, range), (r) => bucketKey(r.date, grouping), ['clicks', 'phoneCalls'] as const) : null
        const taps = ga4
          ? groupSum(
              filterRange(ga4.daily.events, range).filter((r) => r.eventName === 'phone_tap' && matchesChannel(r.channel, 'paid')),
              (r) => bucketKey(r.date, grouping),
              ['eventCount'] as const,
            )
          : null
        const entryDays = new Set(entries.map((e) => e.date))
        const rows = buckets.map((b) => ({
          bucket: b,
          adClicks: adSums ? adSums.get(b)?.clicks ?? 0 : null,
          adCalls: adSums ? adSums.get(b)?.phoneCalls ?? 0 : null,
          phoneTaps: taps ? taps.get(b)?.eventCount ?? 0 : null,
          phoneLeads: off.get(b)?.phoneLeads ?? 0,
          bookedPatients: off.get(b)?.bookedPatients ?? 0,
          daysEntered: entries.filter((e) => bucketKey(e.date, grouping) === b).length,
        }))
        const totals = sumFields(entries, ['phoneLeads', 'bookedPatients'] as const)
        const adTotals = ads ? sumFields(filterRange(ads.daily.account, range), ['clicks', 'phoneCalls'] as const) : null
        const cols: Column<(typeof rows)[number]>[] = [
          { key: 'bucket', label: grouping === 'day' ? 'Day' : grouping === 'week' ? 'Week' : 'Month', render: (r) => bucketLabel(r.bucket, grouping) },
          { key: 'adClicks', label: 'Ad clicks', num: true, render: (r) => fmtInt(r.adClicks) },
          { key: 'adCalls', label: 'Calls from ads', num: true, render: (r) => fmtInt(r.adCalls) },
          { key: 'phoneTaps', label: 'Site phone taps (paid)', num: true, render: (r) => fmtInt(r.phoneTaps) },
          { key: 'phoneLeads', label: 'Phone leads', num: true, render: (r) => fmtInt(r.phoneLeads) },
          { key: 'bookedPatients', label: 'Booked patients', num: true, render: (r) => fmtInt(r.bookedPatients) },
          {
            key: 'daysEntered',
            label: 'Days entered',
            num: true,
            render: (r) => (grouping === 'day' ? (entryDays.has(r.bucket) ? 'Yes' : '-') : fmtInt(r.daysEntered)),
          },
        ]
        const notes = entries.filter((e) => e.note).sort((a, b) => b.date.localeCompare(a.date))
        return (
          <>
            <div className="kpis">
              <Kpi label="Phone leads" value={fmtInt(totals.phoneLeads)} hint={`${entries.length} days entered`} />
              <Kpi label="Booked patients" value={fmtInt(totals.bookedPatients)} />
              <Kpi label="Ad clicks" value={adTotals ? fmtInt(adTotals.clicks) : '-'} />
              <Kpi label="Calls from ads" value={adTotals ? fmtInt(adTotals.phoneCalls) : '-'} />
              <Kpi
                label="Booked per 100 ad clicks"
                value={adTotals ? fmtCount(((ratio(totals.bookedPatients, adTotals.clicks) ?? 0) * 100)) : '-'}
                hint="Rough guide, not attribution"
              />
            </div>
            <TrendChart
              data={rows.map((r) => ({ bucket: r.bucket, adClicks: r.adClicks ?? 0, adCalls: r.adCalls ?? 0, phoneLeads: r.phoneLeads, bookedPatients: r.bookedPatients }))}
              grouping={grouping}
              series={[
                { key: 'adClicks', label: 'Ad clicks', type: 'line', axis: 'right', color: '#8cc4f5', format: fmtInt },
                { key: 'adCalls', label: 'Calls from ads', type: 'bar', color: '#0f6f96', format: fmtInt },
                { key: 'phoneLeads', label: 'Phone leads', type: 'bar', color: '#e0a800', format: fmtInt },
                { key: 'bookedPatients', label: 'Booked patients', type: 'bar', color: '#22a06b', format: fmtInt },
              ]}
            />
            <h3 className="subhead">By {grouping}</h3>
            <DataTable rows={rows} columns={cols} rowKey={(r) => r.bucket} initialSort={{ key: 'bucket', dir: 'desc' }} pageSize={31} caption="Offline leads" />
            {notes.length > 0 && (
              <>
                <h3 className="subhead">Notes</h3>
                <ul className="notes-list">
                  {notes.map((n) => (
                    <li key={n.date}>
                      <time dateTime={n.date}>{shortDate(n.date)}</time>
                      {n.note}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {offline.length === 0 && (
              <p className="chart-legend-note">
                No offline numbers entered yet. Use <a href="/entry">Enter leads</a> to add daily counts.
              </p>
            )}
          </>
        )
      }}
    </Section>
  )
}
