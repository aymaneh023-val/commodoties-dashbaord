import { formatPrice, formatPct, pctArrow, pctColor } from '../utils/formatters'
import { CONFIG_BY_SYMBOL } from '../utils/commodityConfig'

const STRIP_SYMBOLS = ['BRENTOIL-FUT', 'TTF-GAS', 'UREA', 'ZW-FUT', 'XAU', 'CONTAINER-INDEX']

export default function WatchStrip({ commodityData }) {
  return (
    <div
      className="watch-strip sticky z-40 px-4 md:px-6 py-2 md:py-3"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', top: '97px' }}
    >
      <div className="flex items-center gap-4 md:gap-6 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {STRIP_SYMBOLS.map((sym, i) => {
          const cfg = CONFIG_BY_SYMBOL[sym]
          const d = commodityData[sym] ?? {}
          return (
            <div key={sym} className="flex items-center gap-3 shrink-0">
              {i > 0 && <span style={{ color: 'var(--border)' }}>|</span>}

              <span style={{ fontSize: 13, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                {cfg.name}
              </span>

              {d.loading ? (
                <span className="spinner" style={{ width: 10, height: 10 }} />
              ) : (
                <span style={{ fontSize: 14, fontWeight: 600, color: d.error ? 'var(--muted)' : 'var(--text)', whiteSpace: 'nowrap' }}>
                  {formatPrice(d.price, cfg.decimals)}{cfg.unit}
                </span>
              )}

              {!d.loading && d.pctChange != null && (
                <span
                  style={{
                    fontSize: 13, padding: '1px 6px', borderRadius: 4,
                    color: pctColor(d.pctChange, false),
                    background: `${pctColor(d.pctChange, false)}20`,
                    whiteSpace: 'nowrap', fontWeight: 500,
                  }}
                >
                  {pctArrow(d.pctChange)} {formatPct(d.pctChange)}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
