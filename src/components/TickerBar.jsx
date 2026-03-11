import { formatPrice, formatPct, pctArrow, pctColor } from '../utils/formatters'
import { TICKER_LABELS } from '../utils/constants'

const TICKER_UNITS = {
  brent: ' $/bbl',
  ttf:   ' €/MWh',
  bdry:  ' $',
  zim:   ' $',
  urea:  ' $/ton',
}

export default function TickerBar({ data }) {
  const keys = ['brent', 'ttf', 'bdry', 'zim', 'urea']

  return (
    <div
      className="ticker-bar sticky z-40 px-6 py-2 flex items-center gap-6 overflow-x-auto"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', top: '97px' }}
    >
      {keys.map((key, i) => {
        const d = data[key] || {}
        const { price, pctChange, loading, error } = d
        const color = pctColor(pctChange, false)

        return (
          <div key={key} className="flex items-center gap-3 shrink-0">
            {i > 0 && <span style={{ color: 'var(--border)' }}>|</span>}

            <span style={{ fontSize: 13, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
              {TICKER_LABELS[key]}
            </span>

            {loading ? (
              <span className="spinner" style={{ width: 10, height: 10 }} />
            ) : (
              <span style={{ fontSize: 14, fontWeight: 600, color: error ? 'var(--muted)' : 'var(--text)', whiteSpace: 'nowrap' }}>
                {formatPrice(price, 2)}{TICKER_UNITS[key]}
              </span>
            )}

            {!loading && pctChange != null && (
              <span
                style={{
                  fontSize: 13, padding: '1px 6px', borderRadius: 4,
                  color, background: `${color}20`,
                  whiteSpace: 'nowrap', fontWeight: 500,
                }}
              >
                {pctArrow(pctChange)} {formatPct(pctChange)}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
