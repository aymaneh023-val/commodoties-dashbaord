import { formatPrice, formatPct, pctArrow, pctColor } from '../utils/formatters'

/**
 * Reusable metric card.
 * @param {Object} props
 * @param {string} props.title
 * @param {number|null} props.value
 * @param {number|null} props.pctChange
 * @param {string} props.valuePrefix - e.g. '$' for stocks
 * @param {number} props.decimals
 * @param {string} props.unit - appended after value, e.g. ' €/MWh'
 * @param {string} props.subLabel - label under value (e.g. 'USD/bbl')
 * @param {boolean} props.loading
 * @param {boolean} props.error
 * @param {boolean} props.inverse - flip color logic (positive = good)
 * @param {string|null} props.note - small note text below
 * @param {string|null} props.signal - pill text override (e.g. 'Critical')
 * @param {React.ReactNode} props.children - extra content below
 */
export default function DataCard({
  title,
  value,
  pctChange,
  valuePrefix = '',
  decimals = 2,
  unit = '',
  subLabel = '',
  loading = false,
  error = false,
  inverse = false,
  note = null,
  signal = null,
  children,
}) {
  const badgeColor = pctColor(pctChange, inverse)
  const arrow = pctArrow(pctChange)
  const displayValue = formatPrice(value, decimals, valuePrefix) + unit

  return (
    <div className="card relative overflow-hidden">
      {/* Title */}
      <p
        className="text-xs uppercase tracking-widest mb-3"
        style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}
      >
        {title}
      </p>

      {loading ? (
        <div className="flex items-center gap-2">
          <span className="spinner" />
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>Loading…</span>
        </div>
      ) : error ? (
        <div>
          <p
            className="text-2xl font-syne font-bold mb-1"
            style={{ color: 'var(--muted)', fontFamily: "'Syne', sans-serif" }}
          >
            {displayValue !== '—' ? displayValue : '—'}
          </p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            ⚠ Live data unavailable
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-end gap-3 flex-wrap">
            <span
              className="text-3xl font-bold leading-none"
              style={{ fontFamily: "'Syne', sans-serif", color: 'var(--text)' }}
            >
              {displayValue}
            </span>

            {pctChange != null && (
              <span
                className="text-sm font-medium px-2 py-0.5 rounded-md"
                style={{
                  color: badgeColor,
                  background: `${badgeColor}18`,
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {arrow} {formatPct(pctChange)}
              </span>
            )}

            {signal && (
              <SignalPill signal={signal} />
            )}
          </div>

          {subLabel && (
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              {subLabel}
            </p>
          )}
        </>
      )}

      {note && !loading && (
        <p
          className="text-xs mt-3 pt-3 leading-relaxed"
          style={{ color: 'var(--muted)', borderTop: '1px solid var(--border)' }}
        >
          {note}
        </p>
      )}

      {children && <div className="mt-3">{children}</div>}
    </div>
  )
}

function SignalPill({ signal }) {
  const colors = {
    Critical: { bg: '#f87171', text: '#fff' },
    Elevated: { bg: '#fb923c', text: '#fff' },
    Watch: { bg: '#6b7fa3', text: '#fff' },
  }
  const c = colors[signal] || colors.Watch
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: `${c.bg}28`, color: c.bg, border: `1px solid ${c.bg}50` }}
    >
      {signal}
    </span>
  )
}
