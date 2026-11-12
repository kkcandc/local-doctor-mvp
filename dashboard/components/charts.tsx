'use client'

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { bucketLabel, type Grouping } from '@/lib/dates'
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
                type="monotone"
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
