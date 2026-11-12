'use client'

import { useState } from 'react'
import { filterRange, groupSum, ratio, timeSeries } from '@/lib/aggregate'
import { enumLabel, fmtCount, fmtInt, fmtMoney, fmtPct } from '@/lib/format'
import { derive, keywordBidInfo, unusedBidLine } from '@/lib/views'
import { MetricCharts } from '../charts'
import { DataTable, type Column } from '../DataTable'
import { NotConnected, Section, StatusBadge, useData } from '../ui'

export function KeywordsSection() {
  const { snapshot, currency } = useData()
  const ads = snapshot.ads
  const [q, setQ] = useState('')
  const [campaign, setCampaign] = useState('')
  const [match, setMatch] = useState('')
  return (
    <Section id="keywords" num={4} title="Keywords" description="Keywords we bid on, with bids or caps, results and impression share (share of eligible searches where our ad showed).">
      {({ range, grouping }) => {
        if (!ads) return <NotConnected source="Google Ads" />
        const fields = ['impressions', 'clicks', 'cost', 'conversions', 'allConversions', 'eligibleImpressions'] as const
        const daily = filterRange(ads.daily.keywords, range)
        const sums = groupSum(daily, (r) => `${r.adGroupId}|${r.criterionId}`, fields)
        const shareImpr = groupSum(
          daily.filter((r) => r.eligibleImpressions != null),
          (r) => `${r.adGroupId}|${r.criterionId}`,
          ['impressions', 'eligibleImpressions'] as const,
        )
        const campaigns = new Map(ads.campaigns.map((c) => [c.id, c]))
        const adGroups = new Map(ads.adGroups.map((g) => [g.id, g]))
        const meta = new Map(ads.keywords.map((k) => [`${k.adGroupId}|${k.criterionId}`, k]))
        const keys = new Set([...ads.keywords.filter((k) => k.status !== 'REMOVED').map((k) => `${k.adGroupId}|${k.criterionId}`), ...sums.keys()])
        const all = [...keys].map((key) => {
          const k = meta.get(key)
          const [adGroupId, criterionId] = key.split('|')
          const g = adGroups.get(adGroupId)
          const c = campaigns.get(k?.campaignId ?? g?.campaignId ?? '')
          const s = sums.get(key) ?? { impressions: 0, clicks: 0, cost: 0, conversions: 0, allConversions: 0, eligibleImpressions: 0 }
          const sh = shareImpr.get(key)
          const bid = keywordBidInfo(k, g, c)
          return {
            key,
            criterionId,
            text: k?.text ?? `Keyword ${criterionId}`,
            matchType: k?.matchType ?? '',
            status: k?.status ?? '',
            adGroup: g?.name ?? `Ad group ${adGroupId}`,
            campaignId: c?.id ?? '',
            campaign: c?.name ?? '',
            bid,
            share: sh ? ratio(sh.impressions, sh.eligibleImpressions) : null,
            ...derive(s),
          }
        })
        const matchTypes = [...new Set(all.map((r) => r.matchType).filter(Boolean))]
        const needle = q.trim().toLowerCase()
        const rows = all.filter(
          (r) => (!needle || r.text.toLowerCase().includes(needle)) && (!campaign || r.campaignId === campaign) && (!match || r.matchType === match),
        )
        const cols: Column<(typeof rows)[number]>[] = [
          { key: 'text', label: 'Keyword', render: (r) => <b>{r.text}</b> },
          { key: 'matchType', label: 'Match', render: (r) => enumLabel(r.matchType) },
          { key: 'adGroup', label: 'Ad group', render: (r) => <>{r.adGroup}<span className="cell-sub">{r.campaign}</span></> },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          {
            key: 'bid',
            label: 'Bid / cap',
            num: true,
            value: (r) => (r.bid.leadWithCap ? r.bid.maxCpcCap ?? null : r.bid.keywordBid ?? r.bid.adGroupDefault ?? r.bid.maxCpcCap ?? null),
            render: (r) =>
              r.bid.leadWithCap ? (
                <>
                  {r.bid.maxCpcCap != null ? (
                    <>
                      {fmtMoney(r.bid.maxCpcCap, currency)}
                      <span className="cell-sub">Max CPC cap</span>
                    </>
                  ) : (
                    <>
                      Maximize clicks
                    </>
                  )}
                  {r.bid.keywordBid != null && (
                    <span className="cell-sub">{unusedBidLine('Keyword bid', fmtMoney(r.bid.keywordBid, currency))}</span>
                  )}
                  {r.bid.adGroupDefault != null && (
                    <span className="cell-sub">{unusedBidLine('Ad group default', fmtMoney(r.bid.adGroupDefault, currency))}</span>
                  )}
                </>
              ) : (
                <>
                  {r.bid.keywordBid != null && (
                    <>
                      {fmtMoney(r.bid.keywordBid, currency)}
                      <span className="cell-sub">Keyword bid</span>
                    </>
                  )}
                  {r.bid.keywordBid == null && r.bid.adGroupDefault != null && (
                    <>
                      {fmtMoney(r.bid.adGroupDefault, currency)}
                      <span className="cell-sub">Ad group default</span>
                    </>
                  )}
                  {r.bid.keywordBid == null && r.bid.adGroupDefault == null && r.bid.maxCpcCap == null && '-'}
                  {r.bid.maxCpcCap != null && <span className="cell-sub">Max CPC cap {fmtMoney(r.bid.maxCpcCap, currency)}</span>}
                </>
              ),
          },
          { key: 'impressions', label: 'Impr.', num: true, render: (r) => fmtInt(r.impressions) },
          { key: 'clicks', label: 'Clicks', num: true, render: (r) => fmtInt(r.clicks) },
          { key: 'ctr', label: 'CTR', num: true, render: (r) => fmtPct(r.ctr) },
          { key: 'cpc', label: 'Avg CPC', num: true, render: (r) => fmtMoney(r.cpc, currency) },
          { key: 'cost', label: 'Spend', num: true, render: (r) => fmtMoney(r.cost, currency) },
          { key: 'conversions', label: 'Conv.', num: true, render: (r) => fmtCount(r.conversions) },
          { key: 'share', label: 'Impr. share', num: true, render: (r) => (r.share == null ? '-' : r.share <= 0.1 ? '< 10%' : fmtPct(r.share, 0)) },
        ]
        const visible = new Set(rows.map((r) => r.key))
        const series = timeSeries(daily.filter((r) => visible.has(`${r.adGroupId}|${r.criterionId}`)), range, grouping, ['clicks', 'cost'] as const)
        return (
          <>
            <div className="filters">
              <label className="sr-only" htmlFor="kw-q">Search keywords</label>
              <input id="kw-q" className="input" placeholder="Search keywords" value={q} onChange={(e) => setQ(e.target.value)} />
              <label className="sr-only" htmlFor="kw-c">Campaign</label>
              <select id="kw-c" className="select" value={campaign} onChange={(e) => setCampaign(e.target.value)}>
                <option value="">All campaigns</option>
                {ads.campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <label className="sr-only" htmlFor="kw-m">Match type</label>
              <select id="kw-m" className="select" value={match} onChange={(e) => setMatch(e.target.value)}>
                <option value="">All match types</option>
                {matchTypes.map((m) => (
                  <option key={m} value={m}>{enumLabel(m)}</option>
                ))}
              </select>
            </div>
            <DataTable rows={rows} columns={cols} rowKey={(r) => r.key} initialSort={{ key: 'cost', dir: 'desc' }} caption="Keywords" />
            <MetricCharts
              grouping={grouping}
              range={range}
              items={[
                {
                  title: 'Spend',
                  color: '#8cc4f5',
                  format: (n) => fmtMoney(n, currency, 0),
                  allowDecimals: true,
                  values: series.map((point) => ({ bucket: point.bucket, value: point.cost })),
                },
                {
                  title: 'Clicks',
                  color: '#0f3f8c',
                  format: fmtInt,
                  values: series.map((point) => ({ bucket: point.bucket, value: point.clicks })),
                },
              ]}
            />
            <p className="chart-legend-note">Spend and clicks follow the keyword filters above.</p>
          </>
        )
      }}
    </Section>
  )
}
