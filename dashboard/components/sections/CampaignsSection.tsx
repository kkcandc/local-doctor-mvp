'use client'

import { filterRange, groupSum, sumFields } from '@/lib/aggregate'
import { bucketKey, bucketsInRange } from '@/lib/dates'
import { enumLabel, fmtCount, fmtInt, fmtMoney, fmtPct } from '@/lib/format'
import { ADS_FIELDS, derive } from '@/lib/views'
import { COLORS, TrendChart } from '../charts'
import { DataTable, type Column } from '../DataTable'
import { NotConnected, Section, StatusBadge, useData } from '../ui'

export function CampaignsSection() {
  const { snapshot, currency } = useData()
  const ads = snapshot.ads
  return (
    <Section id="campaigns" num={2} title="Campaigns" description="Status, bidding and budget for each campaign, with results for the selected range.">
      {({ range, grouping }) => {
        if (!ads) return <NotConnected source="Google Ads" />
        const fields = [...ADS_FIELDS, 'phoneCalls'] as const
        const rowsInRange = filterRange(ads.daily.campaigns, range)
        const sums = groupSum(rowsInRange, (r) => r.campaignId, fields)
        const meta = new Map(ads.campaigns.map((c) => [c.id, c]))
        const ids = new Set([...ads.campaigns.filter((c) => c.status !== 'REMOVED').map((c) => c.id), ...sums.keys()])
        const rows = [...ids].map((id) => {
          const m = meta.get(id)
          const s = sums.get(id) ?? { impressions: 0, clicks: 0, cost: 0, conversions: 0, allConversions: 0, phoneCalls: 0 }
          return { id, name: m?.name ?? `Campaign ${id}`, status: m?.status ?? '', bid: m?.biddingStrategyType ?? '', cap: m?.maxCpcCap, budget: m?.dailyBudget, ...derive(s), phoneCalls: s.phoneCalls }
        })
        const total = derive(sumFields(rowsInRange, fields))

        const cols: Column<(typeof rows)[number]>[] = [
          { key: 'name', label: 'Campaign', render: (r) => <b>{r.name}</b> },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          {
            key: 'bid',
            label: 'Bid strategy',
            render: (r) => (
              <>
                {enumLabel(r.bid)}
                {r.cap != null && <span className="cell-sub">Max CPC cap {fmtMoney(r.cap, currency)}</span>}
              </>
            ),
          },
          { key: 'budget', label: 'Daily budget', num: true, render: (r) => fmtMoney(r.budget, currency) },
          { key: 'cost', label: 'Spend', num: true, render: (r) => fmtMoney(r.cost, currency), total: fmtMoney(total.cost, currency) },
          { key: 'impressions', label: 'Impr.', num: true, render: (r) => fmtInt(r.impressions), total: fmtInt(total.impressions) },
          { key: 'clicks', label: 'Clicks', num: true, render: (r) => fmtInt(r.clicks), total: fmtInt(total.clicks) },
          { key: 'ctr', label: 'CTR', num: true, render: (r) => fmtPct(r.ctr), total: fmtPct(total.ctr) },
          { key: 'cpc', label: 'Avg CPC', num: true, render: (r) => fmtMoney(r.cpc, currency), total: fmtMoney(total.cpc, currency) },
          { key: 'conversions', label: 'Conv.', num: true, render: (r) => fmtCount(r.conversions), total: fmtCount(total.conversions) },
          { key: 'costPerConversion', label: 'Cost / conv.', num: true, render: (r) => fmtMoney(r.costPerConversion, currency), total: fmtMoney(total.costPerConversion, currency) },
          { key: 'phoneCalls', label: 'Calls', num: true, render: (r) => fmtInt(r.phoneCalls), total: fmtInt(total.phoneCalls) },
        ]

        // Spend per campaign per bucket, stacked.
        const top = [...rows].sort((a, b) => b.cost - a.cost).filter((r) => r.cost > 0).slice(0, 6)
        const byBucket = new Map(bucketsInRange(range, grouping).map((b) => [b, { bucket: b } as Record<string, number | string>]))
        for (const r of rowsInRange) {
          const point = byBucket.get(bucketKey(r.date, grouping))
          if (!point || !top.some((t) => t.id === r.campaignId)) continue
          point[`c${r.campaignId}`] = ((point[`c${r.campaignId}`] as number) ?? 0) + r.cost
        }
        const chartData = [...byBucket.values()].map((p) => {
          for (const t of top) p[`c${t.id}`] ??= 0
          return p
        })
        return (
          <>
            <DataTable rows={rows} columns={cols} rowKey={(r) => r.id} initialSort={{ key: 'cost', dir: 'desc' }} showTotals caption="Campaigns" />
            {top.length > 0 && (
              <TrendChart
                data={chartData}
                grouping={grouping}
                series={top.map((t, i) => ({ key: `c${t.id}`, label: t.name, type: 'bar' as const, stack: 'spend', color: COLORS[i], format: (n: number) => fmtMoney(n, currency, 0) }))}
              />
            )}
          </>
        )
      }}
    </Section>
  )
}
