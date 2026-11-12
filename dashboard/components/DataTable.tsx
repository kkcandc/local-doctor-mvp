'use client'

import { useMemo, useState, type ReactNode } from 'react'

export interface Column<T> {
  key: string
  label: string
  num?: boolean
  /** Value used for sorting. Defaults to row[key]. */
  value?: (row: T) => number | string | null | undefined
  render?: (row: T) => ReactNode
  /** Rendered in the totals row. */
  total?: ReactNode
  sortable?: boolean
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  initialSort,
  pageSize = 25,
  empty = 'No data for this range.',
  showTotals = false,
  caption,
}: {
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T, i: number) => string
  initialSort?: { key: string; dir: 'asc' | 'desc' }
  pageSize?: number
  empty?: string
  showTotals?: boolean
  caption?: string
}) {
  const [sort, setSort] = useState(initialSort)
  const [limit, setLimit] = useState(pageSize)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col) return rows
    const get = col.value ?? ((r: T) => (r as Record<string, unknown>)[col.key] as number | string | null)
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const va = get(a)
      const vb = get(b)
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
      return String(va).localeCompare(String(vb)) * dir
    })
  }, [rows, columns, sort])

  if (!rows.length) return <div className="table-wrap"><div className="empty">{empty}</div></div>

  const visible = sorted.slice(0, limit)

  return (
    <>
      <div className="table-wrap">
        <table className="data">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr>
              {columns.map((c, i) => {
                const active = sort?.key === c.key
                const ariaSort = active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : undefined
                const cls = [c.num ? 'num' : '', i === 0 ? 'first' : ''].join(' ').trim() || undefined
                return (
                  <th key={c.key} className={cls} aria-sort={ariaSort} scope="col">
                    {c.sortable === false ? (
                      c.label
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setSort((s) =>
                            s?.key === c.key
                              ? { key: c.key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
                              : { key: c.key, dir: c.num ? 'desc' : 'asc' },
                          )
                        }
                      >
                        {c.label}
                        {active ? (sort!.dir === 'asc' ? ' \u2191' : ' \u2193') : ''}
                      </button>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, ri) => (
              <tr key={rowKey(row, ri)}>
                {columns.map((c, i) => (
                  <td key={c.key} className={[c.num ? 'num' : '', i === 0 ? 'first' : ''].join(' ').trim() || undefined}>
                    {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {showTotals && (
            <tfoot>
              <tr>
                {columns.map((c, i) => (
                  <td key={c.key} className={[c.num ? 'num' : '', i === 0 ? 'first' : ''].join(' ').trim() || undefined}>
                    {i === 0 && c.total == null ? 'Total' : c.total ?? ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <div className="table-foot">
        <span>
          Showing {visible.length} of {rows.length}
        </span>
        {rows.length > pageSize && (
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={() => setLimit((l) => (l >= rows.length ? pageSize : rows.length))}
          >
            {limit >= rows.length ? 'Show fewer' : `Show all ${rows.length}`}
          </button>
        )}
      </div>
    </>
  )
}
