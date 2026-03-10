import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { FOOD_META } from '../../hooks/useFoodCommoditiesData'
import { formatPrice, formatPct, pctArrow, pctColor } from '../../utils/formatters'

const EXPLAINER =
  'Global food commodity prices are an early warning system for consumer food inflation. ' +
  'Moves in wheat, soybeans and palm oil typically feed into retail food prices with a 3–6 month lag. ' +
  'Natural gas is included as the upstream input — it drives fertilizer costs which drive crop production costs.'

const GROUPS = [
  {
    label: 'GRAINS & OILSEEDS',
    keys: ['wheat', 'corn', 'soybeans', 'soybeanOil', 'soybeanMeal', 'rice'],
  },
  {
    label: 'SOFT COMMODITIES',
    keys: ['sugar', 'palm'],
  },
  {
    label: 'UPSTREAM INPUT',
    keys: ['natgas'],
  },
]

// Fixed colors per commodity for chart
const COMMODITY_COLORS = {
  wheat:       '#f59e0b',
  corn:        '#fcd34d',
  soybeans:    '#4ade80',
  soybeanOil:  '#34d399',
  soybeanMeal: '#6ee7b7',
  rice:        '#38bdf8',
  sugar:       '#f87171',
  palm:        '#fb923c',
  natgas:      '#818cf8',
}

function normalise(arr) {
  const vals = arr.filter(v => v != null)
  if (!vals.length) return arr.map(() => null)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  if (max === min) return arr.map(v => (v != null ? 50 : null))
  return arr.map(v => (v != null ? ((v - min) / (max - min)) * 100 : null))
}

export default function FoodCommodities({ data }) {
  // Build normalised chart data
  const { chartData, chartKeys } = useMemo(() => {
    const keys = Object.keys(FOOD_META).filter(k => (data[k]?.history?.length ?? 0) > 0)
    if (!keys.length) return { chartData: [], chartKeys: [] }

    const maxLen = Math.max(...keys.map(k => data[k].history.length))
    const base = keys.find(k => data[k].history.length === maxLen)

    // Raw values per key
    const rawByKey = {}
    keys.forEach(k => { rawByKey[k] = data[k].history.map(h => h.close) })

    // Normalised
    const normByKey = {}
    keys.forEach(k => { normByKey[k] = normalise(rawByKey[k]) })

    const chart = data[base].history.map((point, i) => {
      const row = { date: point.date }
      keys.forEach(k => {
        row[k] = normByKey[k]?.[i] ?? null
        row[`raw_${k}`] = rawByKey[k]?.[i] ?? null
      })
      return row
    })

    return { chartData: chart, chartKeys: keys }
  }, [data])

  // Auto-insight
  const insight = useMemo(() => {
    const upCount = Object.keys(FOOD_META).filter(k => (data[k]?.pctChange ?? 0) > 10).length
    const total = Object.keys(FOOD_META).length
    if (upCount >= 7) return `Broad-based food shock: ${upCount}/${total} commodities rising — systemic supply chain stress.`
    if (upCount >= 4) return `${upCount}/${total} commodities elevated — partial supply chain disruption.`
    return 'Commodity moves diverging — shock appears sector-specific, not systemic.'
  }, [data])

  return (
    <section id="food" className="mb-14">
      <div className="mb-2">
        <span
          className="text-xs uppercase tracking-widest"
          style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}
        >
          04.5 —
        </span>
        <h2
          className="text-lg font-bold inline ml-2"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Food Commodities
        </h2>
      </div>
      <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400, marginBottom: 20 }}>
        {EXPLAINER}
      </p>

      {/* Card grid by group */}
      {GROUPS.map(group => (
        <div key={group.label} className="mb-6">
          <p
            className="text-xs uppercase tracking-widest mb-3"
            style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.12em' }}
          >
            {group.label}
          </p>
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}
          >
            {group.keys.map(key => {
              const d = data[key] ?? {}
              const meta = FOOD_META[key]
              const color = pctColor(d.pctChange, false)
              const arrow = pctArrow(d.pctChange)
              return (
                <div
                  key={key}
                  className="card"
                  style={{ padding: '14px 16px' }}
                >
                  <p
                    className="text-xs uppercase tracking-widest mb-2"
                    style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 9 }}
                  >
                    {meta.label}
                  </p>
                  {d.loading ? (
                    <div>
                      <div className="skeleton" style={{ width: 70, height: 24, marginBottom: 6 }} />
                      <div className="skeleton" style={{ width: 50, height: 8 }} />
                    </div>
                  ) : d.error ? (
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>—</p>
                  ) : (
                    <>
                      <p
                        className="text-xl font-bold leading-none mb-1"
                        style={{ fontFamily: "'Syne', sans-serif", color: 'var(--text)' }}
                      >
                        {formatPrice(d.price, 2)}{meta.unit}
                      </p>
                      {d.pctChange != null && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ color, background: `${color}18`, fontFamily: "'DM Mono', monospace", fontSize: 10 }}
                        >
                          {arrow} {formatPct(d.pctChange)}
                        </span>
                      )}
                      <p className="mt-2" style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.4 }}>
                        {meta.note}
                      </p>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Normalised comparison chart */}
      {chartData.length > 0 && (
        <div className="card" style={{ padding: '16px 16px 8px' }}>
          <p style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, opacity: 0.7, marginBottom: 8 }}>
            Normalised (0–100%) · 30d · all commodities
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 8, right: 40, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#6b7fa3', fontSize: 10, fontFamily: "'DM Mono', monospace" }}
                axisLine={{ stroke: 'rgba(255,255,255,0.07)' }}
                tickLine={false}
                interval={6}
              />
              <YAxis
                orientation="right"
                domain={[0, 100]}
                tickCount={4}
                tick={{ fill: '#6b7fa3', fontSize: 10, fontFamily: "'DM Mono', monospace" }}
                axisLine={false}
                tickLine={false}
                width={40}
                tickFormatter={v => `${v}%`}
              />
              <Tooltip content={<FoodTooltip />} />
              <Legend
                verticalAlign="bottom"
                align="left"
                iconType="circle"
                iconSize={6}
                wrapperStyle={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: '#6b7fa3', paddingTop: 8 }}
              />
              {chartKeys.map(key => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={COMMODITY_COLORS[key] ?? '#6b7fa3'}
                  strokeWidth={1}
                  dot={false}
                  activeDot={{ r: 2, strokeWidth: 0 }}
                  name={FOOD_META[key]?.label ?? key}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Auto-insight */}
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
        💡 {insight}
      </div>
    </section>
  )
}

function FoodTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs"
      style={{
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        fontFamily: "'DM Mono', monospace",
        maxWidth: 220,
      }}
    >
      <p className="mb-1" style={{ color: 'var(--muted)' }}>{label}</p>
      {payload.map(entry => {
        const rawVal = entry.payload?.[`raw_${entry.dataKey}`]
        const meta = FOOD_META[entry.dataKey]
        return (
          <p key={entry.dataKey} style={{ color: entry.stroke ?? entry.color }}>
            {meta?.label ?? entry.dataKey}: {rawVal != null ? `${Number(rawVal).toFixed(2)}${meta?.unit ?? ''}` : '—'}
          </p>
        )
      })}
    </div>
  )
}
