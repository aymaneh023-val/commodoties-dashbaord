import LineChartWrapper from './LineChart'
import { formatPrice, formatPct, pctArrow, pctColor } from '../utils/formatters'

export default function CommodityNarrative({ symbol, data, config }) {
  const d = data[symbol] ?? {}
  const cfg = config
  const history = d.history ?? []

  const badgeColor = pctColor(d.pctChange, false)
  const arrow = pctArrow(d.pctChange)
  const displayValue = formatPrice(d.price, cfg.decimals, '') + cfg.unit

  const firstDate = history[0]?.date
  const lastDate = history[history.length - 1]?.date

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
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>
            {cfg.name} ({cfg.symbol}) · {firstDate} – {lastDate} · {cfg.unit.trim() || 'index'}
          </p>
          <LineChartWrapper
            data={history}
            lines={[{ key: 'close', color: cfg.color, label: `${cfg.name}${cfg.unit}` }]}
            xKey="date"
            yUnit={cfg.unit}
            height={300}
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
