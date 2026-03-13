import { useState } from 'react'
import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts'

export default function LineChartWrapper({
  data = [],
  lines = [],
  xKey = 'date',
  yUnit = '',
  height = 160,
  referenceLines = [],
  showLegend = false,
}) {
  const [hiddenKeys, setHiddenKeys] = useState({})

  const toggleLine = (entry) => {
    const key = entry.dataKey
    setHiddenKeys((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const formatXAxisTick = (value) => {
    if (typeof value !== 'string') return value
    const dailyLabelMatch = value.match(/^([A-Za-z]{3})\s+(\d{1,2})\s+'\d{2}$/)
    if (dailyLabelMatch) return `${dailyLabelMatch[1]} ${dailyLabelMatch[2]}`
    return value
  }

  if (!data.length) return (
    <div
      className="flex items-center justify-center rounded-lg"
      style={{ height, background: 'var(--surface2)', color: 'var(--muted)', fontSize: 13 }}
    >
      No chart data
    </div>
  )

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReLineChart data={data} margin={{ top: 8, right: 48, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#C2C9E5" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fill: '#131B47', fontSize: 11 }}
          axisLine={{ stroke: '#C2C9E5' }}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={24}
          tickMargin={8}
          height={28}
          tickFormatter={formatXAxisTick}
        />
        <YAxis
          orientation="right"
          tickCount={4}
          tick={{ fill: '#131B47', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          domain={['auto', 'auto']}
          width={48}
        />
        <Tooltip content={<CustomTooltip yUnit={yUnit} />} />
        {showLegend && (
          <Legend
            verticalAlign="bottom"
            align="left"
            iconType="circle"
            iconSize={8}
            onClick={toggleLine}
            wrapperStyle={{ fontSize: 13, color: '#131B47', paddingTop: 10, cursor: 'pointer' }}
            formatter={(value, entry) => (
              <span style={{ color: hiddenKeys[entry.dataKey] ? '#C2C9E5' : '#131B47', transition: 'color 0.15s' }}>
                {value}
              </span>
            )}
          />
        )}
        {referenceLines.map((rl) => (
          <ReferenceLine
            key={rl.value}
            y={rl.value}
            stroke={rl.color || '#8890B5'}
            strokeDasharray="4 4"
            strokeWidth={1}
            label={{
              value: rl.label,
              fill: rl.color || '#8890B5',
              fontSize: 12,
              position: 'insideTopRight',
            }}
          />
        ))}
        {lines.map((l) => (
          <Line
            key={l.key}
            type="monotone"
            dataKey={l.key}
            stroke={l.color}
            strokeWidth={2}
            strokeDasharray={l.dashed ? '5 3' : undefined}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            name={l.label || l.key}
            hide={!!hiddenKeys[l.key]}
          />
        ))}
      </ReLineChart>
    </ResponsiveContainer>
  )
}

function CustomTooltip({ active, payload, label, yUnit }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div
      className="rounded-lg px-3 py-2"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        fontSize: 13,
        boxShadow: '0 2px 8px rgba(19,27,71,0.1)',
      }}
    >
      <p className="mb-1" style={{ color: 'var(--muted)', fontSize: 12 }}>{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color, fontWeight: 600 }}>
          {entry.name}: {entry.value != null ? `${Number(entry.value).toFixed(2)}${yUnit}` : '—'}
        </p>
      ))}
    </div>
  )
}
