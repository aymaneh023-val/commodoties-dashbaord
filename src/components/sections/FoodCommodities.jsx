import { useMemo } from 'react'
import LineChartWrapper from '../LineChart'
import { FOOD_META } from '../../hooks/useFoodCommoditiesData'
import { formatPrice, formatPct, pctArrow, pctColor } from '../../utils/formatters'

const EXPLAINER =
  'Front-month food commodity futures from CBOT (Chicago) and ICE. ' +
  'Prices are in original contract units — see footnote for unit definitions. ' +
  'Card values show latest quotes (regular market price); charts show daily closes over a 30-day window. Percentage changes are 30-day.'

const GROUPS = [
  {
    label: 'Grains & Oilseeds — CBOT Chicago',
    keys: ['wheat', 'corn', 'soybeans', 'soybeanOil'],
  },
  {
    label: 'Soft Commodities',
    keys: ['sugar'],
  },
]

const COMMODITY_COLORS = {
  wheat:       '#B86E00',
  corn:        '#8A6200',
  soybeans:    '#2D7A4F',
  soybeanOil:  '#1E7A5C',
  sugar:       '#D94F3D',
}

const ALL_KEYS = GROUPS.flatMap(g => g.keys)

export default function FoodCommodities({ data }) {
  const insight = useMemo(() => {
    const upCount = Object.keys(FOOD_META).filter(k => (data[k]?.pctChange ?? 0) > 10).length
    const total = Object.keys(FOOD_META).length
    if (upCount === 0) return 'All food commodity moves are below 10% over the past 30 days.'
    return `${upCount} of ${total} food commodities up more than 10% over the past 30 days.`
  }, [data])

  return (
    <section id="food" className="mb-14">
      <div className="mb-2">
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
          Food Commodities
        </h2>
      </div>
      <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 6, lineHeight: 1.6 }}>
        {EXPLAINER}
      </p>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
        ¢/bu = cents per bushel · 1 bushel ≈ 27 kg (wheat), 25 kg (corn &amp; soybeans) · ¢/lb = cents per pound
      </p>

      {GROUPS.map(group => (
        <div key={group.label} className="mb-6">
          <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 12 }}>
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
                <div key={key} className="card" style={{ padding: '14px 16px' }}>
                  <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text)', marginBottom: 8, fontWeight: 600 }}>
                    {meta.label}
                  </p>
                  {d.loading ? (
                    <div>
                      <div className="skeleton" style={{ width: 70, height: 24, marginBottom: 6 }} />
                      <div className="skeleton" style={{ width: 50, height: 10 }} />
                    </div>
                  ) : d.error ? (
                    <p style={{ fontSize: 14, color: 'var(--muted)' }}>—</p>
                  ) : (
                    <>
                      <p className="font-bold leading-none mb-2" style={{ fontSize: 20, color: 'var(--text)' }}>
                        {formatPrice(d.price, 2)}{meta.unit}
                      </p>
                      {d.pctChange != null && (
                        <span
                          style={{ fontSize: 13, padding: '1px 6px', borderRadius: 4, color, background: `${color}20`, fontWeight: 500 }}
                        >
                          {arrow} {formatPct(d.pctChange)}
                        </span>
                      )}
                      <p style={{ marginTop: 8, fontSize: 13, color: 'var(--muted)', lineHeight: 1.4 }}>
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

      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {ALL_KEYS.map(key => {
          const history = data[key]?.history ?? []
          const meta = FOOD_META[key]
          if (history.length === 0) return null
          return (
            <div key={key} className="card" style={{ padding: '16px 16px 8px' }}>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>
                {meta.label} · 30 days · {meta.unit?.trim()}
              </p>
              <LineChartWrapper
                data={history}
                lines={[{ key: 'close', color: COMMODITY_COLORS[key] ?? '#8890B5', label: meta.label }]}
                xKey="date"
                yUnit={meta.unit ?? ''}
                height={140}
              />
            </div>
          )
        })}
      </div>

      <div
        className="mt-4 px-4 py-3 rounded-xl"
        style={{ background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}
      >
        {insight}
      </div>

      <div
        className="mt-3 px-4 py-3 rounded-xl"
        style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderLeft: '3px solid var(--food, #B86E00)', fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}
      >
        <strong>Why tracked:</strong>{' '}
        These crops are key inputs in global food and livestock supply chains.
      </div>
    </section>
  )
}
