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

/**
 * @param {Object} props
 * @param {Array} props.data
 * @param {Array<{key, color, label, dashed?}>} props.lines
 * @param {string} props.xKey
 * @param {string} props.yUnit
 * @param {number} props.height
 * @param {Array<{value, label, color}>} props.referenceLines
 * @param {boolean} props.showLegend
 */
export default function LineChartWrapper({
  data = [],
  lines = [],
  xKey = 'date',
  yUnit = '',
  height = 160,
  referenceLines = [],
  showLegend = false,
}) {
  if (!data.length) return (
    <div
      className="flex items-center justify-center rounded-lg"
      style={{ height, background: 'var(--surface2)', color: 'var(--muted)', fontSize: 12 }}
    >
      No chart data
    </div>
  )

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReLineChart data={data} margin={{ top: 8, right: 40, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fill: '#6b7fa3', fontSize: 11, fontFamily: "'DM Mono', monospace" }}
          axisLine={{ stroke: 'rgba(255,255,255,0.07)' }}
          tickLine={false}
          interval={6}
        />
        <YAxis
          orientation="right"
          tickCount={3}
          tick={{ fill: '#6b7fa3', fontSize: 11, fontFamily: "'DM Mono', monospace" }}
          axisLine={false}
          tickLine={false}
          domain={['auto', 'auto']}
          width={40}
        />
        <Tooltip content={<CustomTooltip yUnit={yUnit} />} />
        {showLegend && (
          <Legend
            verticalAlign="bottom"
            align="left"
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: '#6b7fa3', paddingTop: 8 }}
          />
        )}
        {referenceLines.map((rl) => (
          <ReferenceLine
            key={rl.value}
            y={rl.value}
            stroke={rl.color || '#6b7fa3'}
            strokeDasharray="4 4"
            strokeWidth={1}
            label={{
              value: rl.label,
              fill: rl.color || '#6b7fa3',
              fontSize: 10,
              fontFamily: "'DM Mono', monospace",
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
            strokeWidth={1.5}
            strokeDasharray={l.dashed ? '5 3' : undefined}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
            name={l.label || l.key}
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
      className="rounded-lg px-3 py-2 text-xs"
      style={{
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        fontFamily: "'DM Mono', monospace",
      }}
    >
      <p className="mb-1" style={{ color: 'var(--muted)' }}>{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {entry.value != null ? `${Number(entry.value).toFixed(2)}${yUnit}` : '—'}
        </p>
      ))}
    </div>
  )
}
