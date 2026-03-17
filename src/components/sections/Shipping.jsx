import { useState } from 'react'
import DataCard from '../DataCard'
import CompactCard from '../CompactCard'
import LineChartWrapper from '../LineChart'
import { CONFIG_BY_SYMBOL, CONTAINER_COMPONENTS } from '../../utils/commodityConfig'

function RangeChart({ cfg, history, height = 160 }) {
  const [range, setRange] = useState(30)
  const has90d = history.length >= 60
  const chartData = has90d ? history.slice(-range) : history
  const firstDate = chartData[0]?.date
  const lastDate = chartData[chartData.length - 1]?.date

  const IRAN_WAR_DATE = '2026-02-28'
  const showEvent = firstDate && lastDate && firstDate <= IRAN_WAR_DATE && lastDate >= IRAN_WAR_DATE
  return (
    <div className="card" style={{ padding: '16px 16px 8px' }}>
      <div className="flex items-center justify-between mb-2">
        <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
          {cfg.name} · {firstDate} – {lastDate}
        </p>
        {has90d && (
          <div className="flex" style={{ gap: 2 }}>
            {[30, 90].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 4,
                  border: 'none',
                  cursor: 'pointer',
                  background: range === r ? 'var(--text)' : 'var(--surface2)',
                  color: range === r ? 'var(--bg)' : 'var(--muted)',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {r}d
              </button>
            ))}
          </div>
        )}
      </div>
      <LineChartWrapper
        data={chartData}
        lines={[{ key: 'close', color: cfg.color, label: cfg.name }]}
        xKey="date"
        yUnit={cfg.unit}
        height={height}
        eventLines={showEvent ? [{ date: IRAN_WAR_DATE, label: 'Iran war begins', color: '#B55A5A' }] : []}
      />
    </div>
  )
}

const CARD_SYMBOLS = ['BDRY', 'CONTAINER-INDEX']

const EXPLAINER =
  'Freight cost proxies. ' +
  'BDRY is a US-listed ETF tracking the Baltic Dry Index — the benchmark for dry bulk shipping (grain, coal, iron ore). ' +
  'The Container Shipping Index is a synthetic equal-weight index of Maersk, Hapag-Lloyd, and COSCO, rebased to 100. ' +
  'Both are equity-derived — use for directional trend only.'

const METHODOLOGY_NOTE =
  'The Container Shipping Index is a synthetic equal-weight index tracking the share price performance of Maersk, Hapag-Lloyd, and COSCO — the three largest container carriers on the Europe–Asia trade lane. These companies derive the majority of their revenue from container freight between Europe and Asia, making their combined equity performance a reliable directional proxy for container rates on that corridor. The index is rebased to 100 at the start of the 90-day window.'

export default function Shipping({ data, isOverview = false }) {
  if (isOverview) {
    const allSymbols = [...CARD_SYMBOLS, ...CONTAINER_COMPONENTS]
    return (
      <section id="shipping" className="mb-14">
        <div className="mb-2">
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
            Shipping &amp; Freight
          </h2>
        </div>
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
          {allSymbols.map((sym) => (
            <CompactCard key={sym} symbol={sym} data={data} config={CONFIG_BY_SYMBOL[sym]} />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section id="shipping" className="mb-14">
      <div className="mb-2">
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
          Shipping &amp; Freight
        </h2>
      </div>
      <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 20, lineHeight: 1.6 }}>
        {EXPLAINER}
      </p>

      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {CARD_SYMBOLS.map((sym) => {
          const cfg = CONFIG_BY_SYMBOL[sym]
          const d = data[sym] ?? {}
          return (
            <DataCard
              key={sym}
              title={cfg.name}
              value={d.price}
              pctChange={d.pctChange}
              decimals={cfg.decimals}
              unit={cfg.unit}
              subLabel={`${cfg.symbol} · ${cfg.currency}${cfg.unit} · latest close`}
              loading={d.loading}
              error={d.error}
              inverse={false}
              note={cfg.whyAdded}
              asOf={d.asOf}
              baseDate={d.baseDate}
            />
          )
        })}
      </div>

      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {CARD_SYMBOLS.map((sym) => {
          const cfg = CONFIG_BY_SYMBOL[sym]
          const history = data[sym]?.history ?? []
          if (history.length === 0) return null
          return <RangeChart key={sym} cfg={cfg} history={history} height={160} />
        })}
      </div>

      {/* Methodology note */}
      <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>
        {METHODOLOGY_NOTE}
      </p>

      {/* Component stocks */}
      <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 12 }}>
        Index Components
      </p>

      {CONTAINER_COMPONENTS.map((sym) => {
        const cfg = CONFIG_BY_SYMBOL[sym]
        const d = data[sym] ?? {}
        const history = d.history ?? []

        return (
          <div key={sym} className="mb-4">
            {/* Compact header row */}
            <div className="flex items-baseline gap-3 flex-wrap mb-2">
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                {cfg.name}
              </span>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                {cfg.symbol}
              </span>
              {!d.loading && !d.error && d.price != null && (
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                  {d.price.toFixed(cfg.decimals)}{cfg.unit}
                </span>
              )}
            </div>

            {history.length > 0 && <RangeChart cfg={cfg} history={history} height={160} />}
          </div>
        )
      })}

      <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginTop: 8 }}>
        Note: BDRY and the container stocks are exchange-traded equities — their prices correlate with shipping rate indices but are not the indices themselves.
      </p>
    </section>
  )
}
