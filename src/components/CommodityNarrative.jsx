import { useState } from 'react'
import LineChartWrapper from './LineChart'
import { formatPrice, formatPct, pctArrow, pctColor } from '../utils/formatters'

export default function CommodityNarrative({ symbol, data, config }) {
  const d = data[symbol] ?? {}
  const cfg = config
  const history = d.history ?? []
  const [range, setRange] = useState(30)

  const badgeColor = pctColor(d.pctChange, false)
  const arrow = pctArrow(d.pctChange)
  const displayValue = formatPrice(d.price, cfg.decimals, '') + cfg.unit

  const has90d = history.length >= 35
  const chartData = has90d ? history.slice(-range) : history
  const firstDate = chartData[0]?.date
  const lastDate = chartData[chartData.length - 1]?.date

  const IRAN_WAR_DATE = '2026-02-28'
  const showEvent = firstDate && lastDate && firstDate <= IRAN_WAR_DATE && lastDate >= IRAN_WAR_DATE

  return (
    <div className="mb-10">
      {/* Header row */}
      <div className="flex items-baseline gap-3 flex-wrap mb-1">
        <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          {cfg.name}
        </h3>

        {d.loading ? (
          <div className="skeleton" style={{ width: 80, height: 22 }} />
        ) : d.error ? (
          <span style={{ fontSize: 15, color: 'var(--muted)' }}>—</span>
        ) : (
          <>
            <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
              {displayValue}
            </span>

            {d.pctChange != null && (
              <span
                className="font-semibold px-2 py-0.5 rounded-md"
                style={{ fontSize: 14, color: badgeColor, background: `${badgeColor}20` }}
              >
                {arrow} {formatPct(d.pctChange)}
              </span>
            )}
          </>
        )}
      </div>

      {/* Sub-label row */}
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>
        {cfg.symbol} · {cfg.currency}{cfg.unit} · latest close
        {d.asOf && <> · as of {d.asOf}</>}
      </p>

      {/* whyAdded tag */}
      {cfg.whyAdded && (
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, fontStyle: 'italic' }}>
          {cfg.whyAdded}
        </p>
      )}

      {/* Full-width chart */}
      {history.length > 0 && (
        <div
          className="card"
          style={{ padding: '16px 16px 8px', marginBottom: 12 }}
        >
          <div className="flex items-center justify-between mb-2">
            <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
              {cfg.name} ({cfg.symbol}) · {firstDate} – {lastDate} · {cfg.unit.trim() || 'index'}
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
            lines={[{ key: 'close', color: cfg.color, label: `${cfg.name}${cfg.unit}` }]}
            xKey="date"
            yUnit={cfg.unit}
            height={300}
            eventLines={showEvent ? [{ date: IRAN_WAR_DATE, label: 'Iran war begins', color: '#B55A5A' }] : []}
          />
        </div>
      )}

      {/* Context text */}
      {cfg.contextCopy && (
        <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
          {cfg.contextCopy}
        </p>
      )}
    </div>
  )
}
