'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { bucketLabel, shortDate, type Grouping } from '@/lib/dates'
import { compact } from '@/lib/format'

export const COLORS = ['#0f3f8c', '#0f6f96', '#e0a800', '#8cc4f5', '#22a06b', '#b45309', '#767e89', '#7c3aed']

export interface SeriesDef {
  key: string
  label: string
  type?: 'bar' | 'line'
  axis?: 'left' | 'right'
  color?: string
  stack?: string
  format?: (n: number) => string
}

export function TrendChart({
  data,
  series,
  grouping,
  height,
}: {
  data: Record<string, number | string>[]
  series: SeriesDef[]
  grouping: Grouping
  height?: number
}) {
  const hasRight = series.some((s) => s.axis === 'right')
  const formatters = Object.fromEntries(series.map((s) => [s.key, s.format ?? ((n: number) => compact(n))]))
  return (
    <div className="chart-box" style={height ? { height } : undefined}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: hasRight ? 4 : 12, left: -8, bottom: 0 }}>
          <CartesianGrid stroke="#e7e9ec" vertical={false} />
          <XAxis
            dataKey="bucket"
            tickFormatter={(v: string) => bucketLabel(v, grouping).replace('Wk of ', '')}
            tick={{ fontSize: 11, fill: '#767e89' }}
            tickLine={false}
            axisLine={{ stroke: '#d5d9df' }}
            minTickGap={16}
          />
          <YAxis
            yAxisId="left"
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#767e89' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(n: number) => {
              const first = series.find((s) => (s.axis ?? 'left') === 'left')
              return first?.format ? first.format(n) : compact(n)
            }}
            width={56}
          />
          {hasRight && (
            <YAxis
              yAxisId="right"
              orientation="right"
              allowDecimals={false}
              tick={{ fontSize: 11, fill: '#767e89' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(n: number) => compact(n)}
              width={40}
            />
          )}
          <Tooltip
            labelFormatter={(v) => bucketLabel(String(v), grouping)}
            formatter={(value, name, item) => {
              const key = String(item?.dataKey ?? '')
              const fmt = formatters[key]
              return [fmt ? fmt(Number(value)) : String(value), name]
            }}
            contentStyle={{ borderRadius: 8, border: '1px solid #e7e9ec', fontSize: 13 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
          {series.map((s, i) =>
            s.type === 'line' ? (
              <Line
                key={s.key}
                yAxisId={s.axis ?? 'left'}
                type="linear"
                dataKey={s.key}
                name={s.label}
                stroke={s.color ?? COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={data.length <= 31 ? { r: 2 } : false}
                isAnimationActive={false}
              />
            ) : (
              <Bar
                key={s.key}
                yAxisId={s.axis ?? 'left'}
                dataKey={s.key}
                name={s.label}
                fill={s.color ?? COLORS[i % COLORS.length]}
                stackId={s.stack}
                radius={s.stack ? undefined : [3, 3, 0, 0]}
                maxBarSize={36}
                isAnimationActive={false}
              />
            ),
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export interface MetricPoint {
  bucket: string
  value: number
  partial?: boolean
  coverStart?: string
  coverEnd?: string
}

function MetricTip({
  active,
  payload,
  label,
  grouping,
  format,
  name,
}: {
  active?: boolean
  payload?: { value?: number; payload?: MetricPoint }[]
  label?: string | number
  grouping: Grouping
  format: (n: number) => string
  name: string
}) {
  if (!active || !payload?.length || label == null) return null
  const row = payload[0]?.payload
  return (
    <div className="chart-tip">
      <div>
        {bucketLabel(String(label), grouping)}
        {row?.partial ? ' (partial)' : ''}
      </div>
      {row?.partial && row.coverStart && row.coverEnd && (
        <div className="chart-tip-sub">
          {shortDate(row.coverStart)} - {shortDate(row.coverEnd)}
        </div>
      )}
      <div>
        {name}: <b>{format(Number(payload[0]?.value ?? 0))}</b>
      </div>
    </div>
  )
}

/** One metric, one axis, straight bars. Partial buckets are drawn lighter. */
export function MetricChart({
  title,
  data,
  color,
  grouping,
  format,
  height = 150,
  showAxis = true,
  allowDecimals = false,
}: {
  title: string
  data: MetricPoint[]
  color: string
  grouping: Grouping
  format: (n: number) => string
  height?: number
  showAxis?: boolean
  allowDecimals?: boolean
}) {
  return (
    <div>
      <h3 className="chart-title">{title}</h3>
      <div className="chart-box" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e7e9ec" vertical={false} />
            <XAxis
              dataKey="bucket"
              tick={showAxis ? { fontSize: 11, fill: '#767e89' } : false}
              tickFormatter={(v: string) => bucketLabel(v, grouping).replace('Wk of ', '')}
              tickLine={false}
              axisLine={{ stroke: '#d5d9df' }}
              minTickGap={16}
              height={showAxis ? 24 : 4}
            />
            <YAxis
              allowDecimals={allowDecimals}
              tick={{ fontSize: 11, fill: '#767e89' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(n: number) => format(n)}
              width={56}
            />
            <Tooltip
              content={<MetricTip grouping={grouping} format={format} name={title} />}
              cursor={{ fill: 'rgba(15, 63, 140, 0.06)' }}
            />
            <Bar dataKey="value" maxBarSize={32} radius={[3, 3, 0, 0]} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.bucket} fill={color} fillOpacity={d.partial ? 0.38 : 1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
