'use client'

import { Fragment, useState } from 'react'
import { cpc, ratio, timeSeries } from '@/lib/aggregate'
import { enumLabel, fmtCount, fmtInt, fmtMoney, fmtPct } from '@/lib/format'
import { spendRollup, type RollupNode } from '@/lib/views'
import { TrendChart } from '../charts'
import { NotConnected, Section, useData } from '../ui'

export function RollupSection() {
  const { snapshot, currency } = useData()
  const ads = snapshot.ads
  const [open, setOpen] = useState<Set<string>>(() => new Set(['account']))

  const toggle = (id: string) =>
    setOpen((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <Section
      id="rollup"
      num={9}
      title="Spend roll-up"
      description="Spend at each level: account, campaign, ad group and keyword. Expand a row to drill down. Shares are of total account spend."
    >
      {({ range, grouping }) => {
        if (!ads) return <NotConnected source="Google Ads" />
        const root = spendRollup(ads, range)
        const total = root.cost

        const renderNode = (n: RollupNode): React.ReactNode => {
          const share = ratio(n.cost, total)
          const expandable = n.children.length > 0
          const isOpen = open.has(n.id)
          return (
            <Fragment key={n.id}>
              <tr className={`lvl-${n.level}`}>
                <td className="first">
                  {expandable ? (
                    <button
                      type="button"
                      className="tree-toggle"
                      aria-expanded={isOpen}
                      aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${n.name}`}
                      onClick={() => toggle(n.id)}
                    >
                      {isOpen ? '\u25BE' : '\u25B8'}
                    </button>
                  ) : (
                    <span className="tree-toggle" aria-hidden />
                  )}
                  <span className={`tree-name-${n.level}`}>{n.name}</span>
                  {n.sub && <span className="cell-sub" style={{ display: 'inline', marginLeft: 6 }}>{enumLabel(n.sub)}</span>}
                </td>
                <td className="num">{fmtMoney(n.cost, currency)}</td>
                <td className="num">
                  <span className="share-bar" style={{ width: `${Math.max(2, (share ?? 0) * 60)}px` }} />
                  {fmtPct(share, 0)}
                </td>
                <td className="num">{fmtInt(n.clicks)}</td>
                <td className="num">{fmtMoney(cpc(n.cost, n.clicks), currency)}</td>
                <td className="num">{fmtCount(n.conversions)}</td>
                <td className="num">{fmtMoney(n.conversions ? n.cost / n.conversions : null, currency)}</td>
              </tr>
              {expandable && isOpen && n.children.map(renderNode)}
            </Fragment>
          )
        }

        const series = timeSeries(ads.daily.account, range, grouping, ['cost'] as const)
        return (
          <>
            <div className="filters">
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => {
                  const all = new Set<string>()
                  const walk = (n: RollupNode) => {
                    if (n.children.length) all.add(n.id)
                    n.children.forEach(walk)
                  }
                  walk(root)
                  setOpen(all)
                }}
              >
                Expand all
              </button>
              <button type="button" className="btn btn-secondary btn-small" onClick={() => setOpen(new Set(['account']))}>
                Collapse
              </button>
            </div>
            <div className="table-wrap">
              <table className="data">
                <caption className="sr-only">Spend roll-up</caption>
                <thead>
                  <tr>
                    <th className="first" scope="col">Level</th>
                    <th className="num" scope="col">Spend</th>
                    <th className="num" scope="col">Share</th>
                    <th className="num" scope="col">Clicks</th>
                    <th className="num" scope="col">Avg CPC</th>
                    <th className="num" scope="col">Conv.</th>
                    <th className="num" scope="col">Cost / conv.</th>
                  </tr>
                </thead>
                <tbody>{renderNode(root)}</tbody>
              </table>
            </div>
            <TrendChart
              data={series}
              grouping={grouping}
              height={200}
              series={[{ key: 'cost', label: 'Account spend', type: 'bar', color: '#0f3f8c', format: (n) => fmtMoney(n, currency, 0) }]}
            />
          </>
        )
      }}
    </Section>
  )
}
