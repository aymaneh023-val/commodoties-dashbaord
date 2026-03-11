import { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

const METRIC_OPTIONS = [
  { value: '', label: '— None —', group: null },
  { value: 'brent', label: 'Brent Crude', group: 'Oil', color: 'var(--oil)', unit: '$/bbl' },
  { value: 'ttf', label: 'TTF Natural Gas', group: 'Gas', color: 'var(--gas)', unit: '€/MWh' },
  { value: 'bdry', label: 'BDRY (Dry Bulk)', group: 'Shipping', color: 'var(--shipping)', unit: '$' },
  { value: 'zim', label: 'ZIM (Container)', group: 'Shipping', color: 'var(--shipping)', unit: '$' },
  { value: 'urea', label: 'Urea Futures', group: 'Fertilizer', color: 'var(--fertilizer)', unit: '$/ton' },
]

// Distinct stroke colors for up to 4 lines (resolved at render via getComputedStyle)
const LINE_COLORS = ['#FF8A61', '#3448BF', '#8890B5', '#2D7A4F']

const DEFAULT_SELECTIONS = ['brent', 'ttf', 'zim', 'urea']

function formatXAxisTick(value) {
  if (typeof value !== 'string') return value
  const dailyLabelMatch = value.match(/^([A-Za-z]{3})\s+(\d{1,2})\s+'\d{2}$/)
  if (dailyLabelMatch) return `${dailyLabelMatch[1]} ${dailyLabelMatch[2]}`
  return value
}

function getOptionMeta(value) {
  return METRIC_OPTIONS.find((o) => o.value === value)
}

function normalise(values) {
  const nums = values.filter((v) => v != null)
  if (nums.length === 0) return values.map(() => null)
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  if (max === min) return values.map((v) => (v != null ? 50 : null))
  return values.map((v) => (v != null ? ((v - min) / (max - min)) * 100 : null))
}

function generateInsight(selections, chartData) {
  const active = selections.filter(Boolean)
  if (active.length < 2) return 'Select metrics above to compare their 30-day performance on a normalised scale.'

  const changes = {}
  active.forEach((key) => {
    const vals = chartData.map((d) => d[`raw_${key}`]).filter((v) => v != null)
    if (vals.length >= 2) {
      const first = vals[0]
      const last = vals[vals.length - 1]
      changes[key] = ((last - first) / first) * 100
    }
  })

  const rising = active.filter((k) => (changes[k] ?? 0) > 0)
  const falling = active.filter((k) => (changes[k] ?? 0) < 0)

  if (rising.length === 0 && falling.length === 0)
    return 'Selected metrics show minimal movement over the period.'

  const parts = []
  if (rising.length > 0) parts.push(`${rising.length} of ${active.length} selected metrics rising`)
  if (falling.length > 0) parts.push(`${falling.length} falling`)
  return `${parts.join(', ')} over 30 days.`
}

export default function CompareSection({ commodityData }) {
  const [selections, setSelections] = useState(DEFAULT_SELECTIONS)

  const handleChange = (index, value) => {
    setSelections((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  // Build chart data
  const { chartData, activeMetrics } = useMemo(() => {
    const active = selections.filter(Boolean).map((key) => {
      const meta = getOptionMeta(key)
      const history = commodityData?.[key]?.history || []
      return { key, meta, history }
    })

    if (active.length === 0) return { chartData: [], activeMetrics: [] }

    // Find the metric with the most data points to use as date backbone
    const maxLen = Math.max(...active.map((a) => a.history.length))
    const dateSource = active.find((a) => a.history.length === maxLen) || active[0]

    // Build raw data for each metric
    const rawByKey = {}
    active.forEach(({ key, history }) => {
      rawByKey[key] = history.map((d) => d.close)
    })

    // Normalise each
    const normalised = {}
    active.forEach(({ key }) => {
      normalised[key] = normalise(rawByKey[key])
    })

    // Combine into chart data
    const data = dateSource.history.map((d, i) => {
      const point = { date: d.date }
      active.forEach(({ key }) => {
        point[key] = normalised[key]?.[i] ?? null
        point[`raw_${key}`] = rawByKey[key]?.[i] ?? null
      })
      return point
    })

    return { chartData: data, activeMetrics: active }
  }, [selections, commodityData])

  const insight = generateInsight(selections, chartData)

  // Group options for select
  const groupedOptions = useMemo(() => {
    const groups = []
    let currentGroup = null
    METRIC_OPTIONS.forEach((opt) => {
      if (!opt.group) {
        groups.push(opt)
      } else {
        if (currentGroup !== opt.group) {
          currentGroup = opt.group
          groups.push({ type: 'group', label: opt.group })
        }
        groups.push(opt)
      }
    })
    return groups
  }, [])

  return (
    <section id="compare" className="mb-14">
      <div className="mb-2">
        <h2
          className="text-lg font-bold"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Compare Metrics
        </h2>
      </div>
      <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400, marginBottom: 20 }}>
        Select up to 4 indicators to compare on a normalised 0–100% scale. Each series is independently min-max scaled over 30 days.
      </p>

      {/* Dropdowns */}
      <div
        className="grid gap-3 mb-6"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}
      >
        {[0, 1, 2, 3].map((idx) => (
          <div key={idx}>
            <label
              className="text-xs block mb-1"
              style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10 }}
            >
              Metric {idx + 1}
            </label>
            <select
              value={selections[idx] || ''}
              onChange={(e) => handleChange(idx, e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-xs"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontFamily: "'DM Mono', monospace",
                fontSize: 12,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {groupedOptions.map((opt, i) =>
                opt.type === 'group' ? (
                  <optgroup key={`g-${opt.label}`} label={`── ${opt.label} ──`} />
                ) : (
                  <option key={opt.value || `none-${i}`} value={opt.value}>
                    {opt.label}
                  </option>
                )
              )}
            </select>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div
        className="card"
        style={{ padding: '16px 16px 8px' }}
      >
        {activeMetrics.length === 0 ? (
          <div
            className="flex items-center justify-center"
            style={{ height: 260, color: 'var(--muted)', fontSize: 12 }}
          >
            Select at least one metric to compare
          </div>
        ) : (
          <>
            <p
              style={{
                color: 'var(--muted)',
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                opacity: 0.7,
                marginBottom: 8,
              }}
            >
              Normalised (%) · 30d
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 8, right: 40, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(194,201,229,0.4)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#8890B5', fontSize: 10, fontFamily: "'DM Mono', monospace" }}
                  axisLine={{ stroke: 'rgba(194,201,229,0.5)' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={24}
                  tickMargin={8}
                  height={28}
                  tickFormatter={formatXAxisTick}
                />
                <YAxis
                  orientation="right"
                  domain={[0, 100]}
                  tickCount={5}
                  tick={{ fill: '#8890B5', fontSize: 11, fontFamily: "'DM Mono', monospace" }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<CompareTooltip activeMetrics={activeMetrics} />} />
                <Legend
                  verticalAlign="bottom"
                  align="left"
                  iconType="circle"
                  iconSize={7}
                  wrapperStyle={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: '#8890B5', paddingTop: 8 }}
                />
                {activeMetrics.map(({ key, meta }, i) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={LINE_COLORS[i % LINE_COLORS.length]}
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 3, strokeWidth: 0 }}
                    name={meta?.label || key}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {/* Insight row */}
      <div
        className="mt-4 px-4 py-3 rounded-xl text-xs"
        style={{
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          color: 'var(--muted)',
          fontFamily: "'DM Mono', monospace",
          fontSize: 12,
          lineHeight: 1.6,
        }}
      >
        {insight}
      </div>
    </section>
  )
}

function CompareTooltip({ active, payload, label, activeMetrics }) {
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
      {payload.map((entry) => {
        const meta = getOptionMeta(entry.dataKey)
        const rawKey = `raw_${entry.dataKey}`
        const rawVal = entry.payload?.[rawKey]
        return (
          <p key={entry.dataKey} style={{ color: entry.color }}>
            {meta?.label || entry.dataKey}: {rawVal != null ? `${rawVal.toFixed(2)} ${meta?.unit || ''}` : '—'}
          </p>
        )
      })}
    </div>
  )
}
