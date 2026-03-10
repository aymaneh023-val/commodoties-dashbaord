import { formatPrice, formatPct, pctArrow, pctColor } from '../utils/formatters'
import { TICKER_LABELS } from '../utils/constants'

const TICKER_UNITS = {
  brent: ' $/bbl',
  wti: ' $/bbl',
  ttf: ' €/MWh',
  bdi: '',
  lng: ' $',
  mos: ' $',
}

const TICKER_INVERSE = { bdi: true }

export default function TickerBar({ data }) {
  const keys = ['brent', 'wti', 'ttf', 'bdi', 'lng', 'mos']

  return (
    <div
      className="ticker-bar sticky z-40 px-6 py-2 flex items-center gap-6 overflow-x-auto"
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        top: '97px',  // below sticky header (adjust to header height)
      }}
    >
      {keys.map((key, i) => {
        const d = data[key] || {}
        const { price, pctChange, loading, error } = d
        const inverse = !!TICKER_INVERSE[key]
        const color = pctColor(pctChange, inverse)
        const arrow = pctArrow(pctChange)

        return (
          <div key={key} className="flex items-center gap-3 shrink-0">
            {i > 0 && (
              <span style={{ color: 'var(--border)', userSelect: 'none' }}>|</span>
            )}

            <span
              className="text-xs"
              style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap' }}
            >
              {TICKER_LABELS[key]}
            </span>

            {loading ? (
              <span className="spinner" style={{ width: 10, height: 10 }} />
            ) : (
              <span
                className="text-sm font-medium"
                style={{
                  fontFamily: "'Syne', sans-serif",
                  color: error ? 'var(--muted)' : 'var(--text)',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatPrice(price, 2)}{TICKER_UNITS[key]}
              </span>
            )}

            {!loading && pctChange != null && (
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{
                  color,
                  background: `${color}18`,
                  fontFamily: "'DM Mono', monospace",
                  whiteSpace: 'nowrap',
                }}
              >
                {arrow} {formatPct(pctChange)}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
