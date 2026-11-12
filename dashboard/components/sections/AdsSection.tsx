'use client'

import { useState } from 'react'
import { ctr, filterRange, groupSum } from '@/lib/aggregate'
import { enumLabel, fmtCount, fmtInt, fmtMoney, fmtPct } from '@/lib/format'
import { DataTable, type Column } from '../DataTable'
import { NotConnected, Section, Seg, StatusBadge, useData } from '../ui'

const SITE = 'trylocaldoctor.com'

export function AdsSection() {
  const { snapshot, currency } = useData()
  const ads = snapshot.ads
  const [show, setShow] = useState<'active' | 'all'>('active')
  return (
    <Section
      id="ads"
      num={3}
      title="Ads (listings)"
      description="What people see on Google: each ad's headlines and descriptions, plus the sitelinks and call button shown with them."
      showGrouping={false}
    >
      {({ range }) => {
        if (!ads) return <NotConnected source="Google Ads" />
        const fields = ['impressions', 'clicks', 'cost', 'conversions'] as const
        const adSums = groupSum(filterRange(ads.daily.ads, range), (r) => r.adId, fields)
        const campaignName = new Map(ads.campaigns.map((c) => [c.id, c.name]))
        const adGroupName = new Map(ads.adGroups.map((g) => [g.id, g.name]))
        const list = ads.ads
          .map((a) => ({ ...a, m: adSums.get(a.id) ?? { impressions: 0, clicks: 0, cost: 0, conversions: 0 } }))
          .filter((a) => show === 'all' || a.status === 'ENABLED' || a.m.impressions > 0)
          .sort((a, b) => b.m.impressions - a.m.impressions)

        const assetSums = groupSum(filterRange(ads.daily.assets, range), (r) => r.assetId, ['impressions', 'clicks', 'cost'] as const)
        const seen = new Set<string>()
        const assetRows = ads.assets
          .filter((a) => {
            const key = `${a.id}|${a.level}|${a.campaignId ?? ''}|${a.adGroupId ?? ''}`
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })
          .map((a) => {
            const m = assetSums.get(a.id) ?? { impressions: 0, clicks: 0, cost: 0 }
            const where =
              a.level === 'customer'
                ? 'Whole account'
                : a.level === 'campaign'
                  ? campaignName.get(a.campaignId ?? '') ?? 'Campaign'
                  : adGroupName.get(a.adGroupId ?? '') ?? 'Ad group'
            return { key: `${a.id}|${a.level}|${a.campaignId ?? ''}|${a.adGroupId ?? ''}`, ...a, where, ...m, ctr: ctr(m.clicks, m.impressions) }
          })

        const assetCols: Column<(typeof assetRows)[number]>[] = [
          {
            key: 'linkText',
            label: 'Asset',
            value: (r) => r.linkText ?? r.phoneNumber ?? '',
            render: (r) => (
              <>
                <b>{r.type === 'CALL' ? `Call: ${r.phoneNumber ?? ''}` : r.linkText}</b>
                {(r.description1 || r.description2) && (
                  <span className="cell-sub">{[r.description1, r.description2].filter(Boolean).join(' | ')}</span>
                )}
                {r.finalUrls?.[0] && <span className="cell-sub">{r.finalUrls[0]}</span>}
              </>
            ),
          },
          { key: 'type', label: 'Type', render: (r) => <span className="badge badge-blue">{enumLabel(r.type)}</span> },
          { key: 'where', label: 'Linked to' },
          { key: 'impressions', label: 'Impr.', num: true, render: (r) => fmtInt(r.impressions) },
          { key: 'clicks', label: 'Clicks', num: true, render: (r) => fmtInt(r.clicks) },
          { key: 'ctr', label: 'CTR', num: true, render: (r) => fmtPct(r.ctr) },
          { key: 'cost', label: 'Spend', num: true, render: (r) => fmtMoney(r.cost, currency) },
        ]

        return (
          <>
            <div className="filters">
              <Seg
                label="Which ads"
                value={show}
                onChange={setShow}
                options={[
                  { id: 'active', label: 'Active or served' },
                  { id: 'all', label: 'All ads' },
                ]}
              />
            </div>
            {list.length === 0 ? (
              <div className="empty">No ads for this range.</div>
            ) : (
              <div className="ad-cards">
                {list.map((a) => (
                  <article className="ad-card" key={a.id}>
                    <div className="ad-meta">
                      <span>
                        {campaignName.get(a.campaignId) ?? 'Campaign'} / {adGroupName.get(a.adGroupId) ?? 'Ad group'}
                      </span>
                      <StatusBadge status={a.status} />
                    </div>
                    <div className="ad-preview" aria-label="Ad preview">
                      <div className="ad-url">
                        <b>Sponsored</b> {SITE}
                        {[a.path1, a.path2].filter(Boolean).map((p) => ` > ${p}`).join('')}
                      </div>
                      <div className="ad-headline">{a.headlines.slice(0, 3).join(' | ') || enumLabel(a.type)}</div>
                      <div className="ad-desc">{a.descriptions[0]}</div>
                    </div>
                    {a.headlines.length > 0 && (
                      <div>
                        <div className="ad-label">Headlines ({a.headlines.length})</div>
                        <div className="chips">
                          {a.headlines.map((h, i) => (
                            <span className="chip" key={i}>
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {a.descriptions.length > 0 && (
                      <div>
                        <div className="ad-label">Descriptions ({a.descriptions.length})</div>
                        <ul className="ad-list">
                          {a.descriptions.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {a.finalUrls[0] && (
                      <div className="ad-url">
                        Landing page: <b>{a.finalUrls[0]}</b>
                      </div>
                    )}
                    <div className="ad-stats">
                      <div className="ad-stat">
                        Impr.<b>{fmtInt(a.m.impressions)}</b>
                      </div>
                      <div className="ad-stat">
                        Clicks<b>{fmtInt(a.m.clicks)}</b>
                      </div>
                      <div className="ad-stat">
                        CTR<b>{fmtPct(ctr(a.m.clicks, a.m.impressions))}</b>
                      </div>
                      <div className="ad-stat">
                        Spend<b>{fmtMoney(a.m.cost, currency, 0)}</b>
                      </div>
                      <div className="ad-stat">
                        Conv.<b>{fmtCount(a.m.conversions)}</b>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <h3 className="subhead">Sitelinks and call asset</h3>
            <DataTable rows={assetRows} columns={assetCols} rowKey={(r) => r.key} initialSort={{ key: 'impressions', dir: 'desc' }} empty="No sitelinks or call assets found." caption="Assets" />
          </>
        )
      }}
    </Section>
  )
}
