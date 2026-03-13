import { formatPrice, formatPct, pctArrow, pctColor } from '../utils/formatters'

export default function CompactCard({ symbol, data, config }) {
  const d = data[symbol] ?? {}
  const cfg = config
  const badgeColor = pctColor(d.pctChange, false)
  const arrow = pctArrow(d.pctChange)
  const displayValue = formatPrice(d.price, cfg.decimals, '') + cfg.unit

  // Mini sparkline from last 30 points of history
  const history = d.history ?? []
  const spark = history.slice(-30)

  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <p
        className="uppercase tracking-widest mb-2"
        style={{ color: 'var(--text)', fontSize: 11, letterSpacing: '0.1em', fontWeight: 600 }}
      >
        {cfg.name}
      </p>

      {d.loading ? (
        <div className="skeleton" style={{ width: 80, height: 24 }} />
      ) : d.error ? (
        <p style={{ fontSize: 18, color: 'var(--muted)', fontWeight: 700 }}>—</p>
      ) : (
        <>
          <div className="flex items-end gap-2 flex-wrap">
            <span className="font-bold leading-none" style={{ fontSize: 20, color: 'var(--text)' }}>
              {displayValue}
            </span>
            {d.pctChange != null && (
              <span
                className="font-semibold px-1.5 py-0.5 rounded"
                style={{ fontSize: 12, color: badgeColor, background: `${badgeColor}20` }}
              >
                {arrow} {formatPct(d.pctChange)}
              </span>
            )}
          </div>

          {/* Sparkline */}
          {spark.length > 1 && (
            <Sparkline data={spark} color={cfg.color} />
          )}

          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
            {cfg.symbol} · {cfg.currency}{cfg.unit}
          </p>
        </>
      )}
    </div>
  )
}

function Sparkline({ data, color }) {
  const values = data.map((d) => d.close).filter((v) => v != null)
  if (values.length < 2) return null

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const w = 120
  const h = 32
  const step = w / (values.length - 1)

  const points = values
    .map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`)
    .join(' ')

  return (
    <svg width={w} height={h} style={{ display: 'block', marginTop: 6 }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
