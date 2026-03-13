import { formatPrice, formatPct, pctArrow, pctColor } from '../utils/formatters'
import { CONFIG_BY_SYMBOL } from '../utils/commodityConfig'

const TICKER_SYMBOLS = ['BRENTOIL-FUT', 'TTF-GAS', 'BDRY', 'CONTAINER-INDEX', 'UREA']

export default function TickerBar({ data }) {
  return (
    <div
      className="ticker-bar sticky z-40 px-6 py-2 flex items-center gap-6 overflow-x-auto"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', top: '97px' }}
    >
      {TICKER_SYMBOLS.map((sym, i) => {
        const cfg = CONFIG_BY_SYMBOL[sym]
        const d = data[sym] || {}
        const { price, pctChange, loading, error } = d
        const color = pctColor(pctChange, false)

        return (
          <div key={sym} className="flex items-center gap-3 shrink-0">
            {i > 0 && <span style={{ color: 'var(--border)' }}>|</span>}

            <span style={{ fontSize: 13, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
              {cfg.name}
            </span>

            {loading ? (
              <span className="spinner" style={{ width: 10, height: 10 }} />
            ) : (
              <span style={{ fontSize: 14, fontWeight: 600, color: error ? 'var(--muted)' : 'var(--text)', whiteSpace: 'nowrap' }}>
                {formatPrice(price, cfg.decimals)}{cfg.unit}
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
