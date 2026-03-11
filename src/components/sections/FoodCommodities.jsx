import { useMemo } from 'react'
import LineChartWrapper from '../LineChart'
import { FOOD_META } from '../../hooks/useFoodCommoditiesData'
import { formatPrice, formatPct, pctArrow, pctColor } from '../../utils/formatters'

const EXPLAINER =
  'Global food commodity futures from CBOT and ICE. ' +
  'Prices are in original contract units. All contracts are front-month, 30-day daily data via Yahoo Finance.'

const GROUPS = [
  {
    label: 'GRAINS & OILSEEDS',
    keys: ['wheat', 'corn', 'soybeans', 'soybeanOil', 'rice'],
  },
  {
    label: 'SOFT COMMODITIES',
    keys: ['sugar'],
  },
]

const COMMODITY_COLORS = {
  wheat:       '#f59e0b',
  corn:        '#fcd34d',
  soybeans:    '#4ade80',
  soybeanOil:  '#34d399',
  rice:        '#38bdf8',
  sugar:       '#f87171',
}

const ALL_KEYS = GROUPS.flatMap(g => g.keys)

export default function FoodCommodities({ data }) {
  // Auto-insight
  const insight = useMemo(() => {
    const upCount = Object.keys(FOOD_META).filter(k => (data[k]?.pctChange ?? 0) > 10).length
    const total = Object.keys(FOOD_META).length
    if (upCount === 0) return 'All food commodity moves are below 10% over 30 days.'
    return `${upCount} of ${total} food commodities up >10% over 30 days.`
  }, [data])

  return (
    <section id="food" className="mb-14">
      <div className="mb-2">
        <span
          className="text-xs uppercase tracking-widest"
          style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}
        >
          01 —
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

      {/* Individual charts */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {ALL_KEYS.map(key => {
          const history = data[key]?.history ?? []
          const meta = FOOD_META[key]
          if (history.length === 0) return null
          return (
            <div key={key} className="card" style={{ padding: '16px 16px 8px' }}>
              <p style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, opacity: 0.7, marginBottom: 8 }}>
                {meta.label} · 30d · {meta.unit?.trim()}
              </p>
              <LineChartWrapper
                data={history}
                lines={[{ key: 'close', color: COMMODITY_COLORS[key] ?? '#6b7fa3', label: meta.label }]}
                xKey="date"
                yUnit={meta.unit ?? ''}
                height={140}
              />
            </div>
          )
        })}
      </div>

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
        {insight}
      </div>
    </section>
  )
}
