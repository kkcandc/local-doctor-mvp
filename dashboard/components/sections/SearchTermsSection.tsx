'use client'

import { useState } from 'react'
import { filterRange, groupSum } from '@/lib/aggregate'
import { bucketKey, bucketLabel } from '@/lib/dates'
import { enumLabel, fmtCount, fmtInt, fmtMoney, fmtPct } from '@/lib/format'
import { derive } from '@/lib/views'
import { DataTable, type Column } from '../DataTable'
import { NotConnected, Section, Seg, useData } from '../ui'

export function SearchTermsSection() {
  const { snapshot, currency } = useData()
  const ads = snapshot.ads
  const [q, setQ] = useState('')
  const [source, setSource] = useState('')
  const [campaign, setCampaign] = useState('')
  const [view, setView] = useState<'total' | 'period'>('total')
  return (
    <Section
      id="search-terms"
      num={5}
      title="Search terms"
      description="What people actually typed before clicking or seeing our ad, and how Google matched it. Switch to By period to see each term per day, week or month."
    >
      {({ range, grouping }) => {
        if (!ads) return <NotConnected source="Google Ads" />
        const fields = ['impressions', 'clicks', 'cost', 'conversions', 'allConversions'] as const
        const campaignName = new Map(ads.campaigns.map((c) => [c.id, c.name]))
        const adGroupName = new Map(ads.adGroups.map((g) => [g.id, g.name]))
        const needle = q.trim().toLowerCase()
        const daily = filterRange(ads.daily.searchTerms, range).filter(
          (r) =>
            (!needle || r.searchTerm.toLowerCase().includes(needle)) &&
            (!source || r.matchSource === source) &&
            (!campaign || r.campaignId === campaign),
        )
        const keyOf = (r: (typeof daily)[number]) =>
          [view === 'period' ? bucketKey(r.date, grouping) : '', r.searchTerm, r.matchSource, r.adGroupId].join('\u0000')
        const sums = groupSum(daily, keyOf, fields)
        const firstRow = new Map<string, (typeof daily)[number]>()
        for (const r of daily) if (!firstRow.has(keyOf(r))) firstRow.set(keyOf(r), r)
        const rows = [...sums.entries()].map(([key, s]) => {
          const r = firstRow.get(key)!
          const period = key.split('\u0000')[0]
          return {
            key,
            period,
            searchTerm: r.searchTerm,
            matchSource: r.matchSource,
            campaign: campaignName.get(r.campaignId) ?? '',
            adGroup: adGroupName.get(r.adGroupId) ?? '',
            ...derive(s),
          }
        })
        const sources = [...new Set(ads.daily.searchTerms.map((r) => r.matchSource))].sort()

        const cols: Column<(typeof rows)[number]>[] = [
          ...(view === 'period'
            ? [{ key: 'period', label: grouping === 'day' ? 'Day' : grouping === 'week' ? 'Week' : 'Month', render: (r: (typeof rows)[number]) => bucketLabel(r.period, grouping) }]
            : []),
          { key: 'searchTerm', label: 'Search term', render: (r) => <b>{r.searchTerm}</b> },
          { key: 'matchSource', label: 'Match source', render: (r) => enumLabel(r.matchSource) },
          { key: 'adGroup', label: 'Ad group', render: (r) => <>{r.adGroup}<span className="cell-sub">{r.campaign}</span></> },
          { key: 'impressions', label: 'Impr.', num: true, render: (r) => fmtInt(r.impressions) },
          { key: 'clicks', label: 'Clicks', num: true, render: (r) => fmtInt(r.clicks) },
          { key: 'ctr', label: 'CTR', num: true, render: (r) => fmtPct(r.ctr) },
          { key: 'cpc', label: 'Avg CPC', num: true, render: (r) => fmtMoney(r.cpc, currency) },
          { key: 'cost', label: 'Spend', num: true, render: (r) => fmtMoney(r.cost, currency) },
          { key: 'conversions', label: 'Conv.', num: true, render: (r) => fmtCount(r.conversions) },
        ]
        return (
          <>
            <div className="filters">
              <label className="sr-only" htmlFor="st-q">Filter search terms</label>
              <input id="st-q" className="input" placeholder="Filter search terms" value={q} onChange={(e) => setQ(e.target.value)} />
              <label className="sr-only" htmlFor="st-s">Match source</label>
              <select id="st-s" className="select" value={source} onChange={(e) => setSource(e.target.value)}>
                <option value="">All match sources</option>
                {sources.map((s) => (
                  <option key={s} value={s}>{enumLabel(s)}</option>
                ))}
              </select>
              <label className="sr-only" htmlFor="st-c">Campaign</label>
              <select id="st-c" className="select" value={campaign} onChange={(e) => setCampaign(e.target.value)}>
                <option value="">All campaigns</option>
                {ads.campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <Seg
                label="Search terms view"
                value={view}
                onChange={setView}
                options={[
                  { id: 'total', label: 'Total for range' },
                  { id: 'period', label: 'By period' },
                ]}
              />
            </div>
            <DataTable
              rows={rows}
              columns={cols}
              rowKey={(r) => r.key}
              initialSort={view === 'period' ? { key: 'period', dir: 'desc' } : { key: 'impressions', dir: 'desc' }}
              caption="Search terms"
              key={view}
            />
          </>
        )
      }}
    </Section>
  )
}
