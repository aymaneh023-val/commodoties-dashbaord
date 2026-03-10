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
 * @param {Array} props.data - array of data points
 * @param {Array<{key: string, color: string, label: string}>} props.lines
 * @param {string} props.xKey - key for x-axis (e.g. 'date' or 'month')
 * @param {string} props.yUnit - unit appended in tooltip
 * @param {number} props.height
 * @param {Array<{value: number, label: string, color: string}>} props.referenceLines
 * @param {boolean} props.showLegend
 */
export default function LineChartWrapper({
  data = [],
  lines = [],
  xKey = 'date',
  yUnit = '',
  height = 200,
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
      <ReLineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey={xKey}
          tick={{ fill: '#6b7fa3', fontSize: 11, fontFamily: "'DM Mono', monospace" }}
          axisLine={{ stroke: 'rgba(255,255,255,0.07)' }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#6b7fa3', fontSize: 11, fontFamily: "'DM Mono', monospace" }}
          axisLine={false}
          tickLine={false}
          domain={['auto', 'auto']}
        />
        <Tooltip content={<CustomTooltip yUnit={yUnit} lines={lines} />} />
        {showLegend && (
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: '#6b7fa3' }}
          />
        )}
        {referenceLines.map((rl) => (
          <ReferenceLine
            key={rl.value}
            y={rl.value}
            stroke={rl.color || '#6b7fa3'}
            strokeDasharray="4 4"
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
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            name={l.label || l.key}
          />
        ))}
      </ReLineChart>
    </ResponsiveContainer>
  )
}

function CustomTooltip({ active, payload, label, yUnit, lines }) {
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
