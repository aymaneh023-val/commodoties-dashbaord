import { formatPrice, formatPct, pctArrow, pctColor } from '../utils/formatters'

const ITEMS = [
  { key: 'brent', label: 'Brent', unit: '$/bbl', decimals: 2, source: 'commodity' },
  { key: 'ttf',   label: 'TTF',   unit: '€/MWh', decimals: 2, source: 'commodity' },
  { key: 'urea',  label: 'Urea',  unit: '$/ton',  decimals: 2, source: 'commodity' },
  { key: 'wheat', label: 'Wheat', unit: '¢/bu',   decimals: 2, source: 'food' },
  { key: 'hicp_food', label: 'EA Food HICP', unit: '%', decimals: 1, source: 'eurostat' },
]

export default function WatchStrip({ commodityData, foodData, eurostatFood }) {
  return (
    <div
      className="sticky z-40 px-6 py-3"
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        top: '97px',
      }}
    >
      <div className="flex items-center gap-6 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {ITEMS.map((item, i) => {
          const d = resolveData(item, commodityData, foodData, eurostatFood)
          return (
            <div key={item.key} className="flex items-center gap-3 shrink-0">
              {i > 0 && (
                <span style={{ color: 'var(--border)', userSelect: 'none' }}>|</span>
              )}

              <span
                className="text-xs"
                style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap' }}
              >
                {item.label}
              </span>

              {d.loading ? (
                <span className="spinner" style={{ width: 10, height: 10 }} />
              ) : (
                <span
                  className="text-sm font-medium"
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    color: d.error ? 'var(--muted)' : 'var(--text)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {d.display}{item.unit ? ` ${item.unit}` : ''}
                </span>
              )}

              {!d.loading && d.pctChange != null && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    color: pctColor(d.pctChange, false),
                    background: `${pctColor(d.pctChange, false)}18`,
                    fontFamily: "'DM Mono', monospace",
                    whiteSpace: 'nowrap',
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

function resolveData(item, commodityData, foodData, eurostatFood) {
  if (item.source === 'commodity') {
    const d = commodityData?.[item.key] ?? {}
    return {
      loading: d.loading ?? true,
      error: d.error ?? false,
      display: formatPrice(d.price, item.decimals),
      pctChange: d.pctChange ?? null,
    }
  }

  if (item.source === 'food') {
    const d = foodData?.[item.key] ?? {}
    return {
      loading: d.loading ?? true,
      error: d.error ?? false,
      display: formatPrice(d.price, item.decimals),
      pctChange: d.pctChange ?? null,
    }
  }

  if (item.source === 'eurostat') {
    const latest = eurostatFood?.latest
    const data = eurostatFood?.data ?? []
    const loading = eurostatFood?.loading ?? true
    const error = eurostatFood?.error ?? false

    if (loading || !latest) {
      return { loading, error, display: '—', pctChange: null }
    }

    // Compute YoY-style change from first to last data point available
    const prev = data.length >= 2 ? data[data.length - 2] : null
    const mom = prev ? (latest.value - prev.value) : null

    return {
      loading: false,
      error,
      display: latest.value != null ? latest.value.toFixed(item.decimals) : '—',
      pctChange: mom,
      isIndex: true,
    }
  }

  return { loading: true, error: false, display: '—', pctChange: null }
}
