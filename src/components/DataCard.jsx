import { formatPrice, formatPct, pctArrow, pctColor } from '../utils/formatters'

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
  asOf = null,
  isFallback = false,
  fromCache = false,
  cacheAge = null,
  baseDate = null,
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
        /* Skeleton — no text, just animated placeholders */
        <div>
          <div className="skeleton" style={{ width: 80, height: 32, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 120, height: 10, marginBottom: 4 }} />
          <div className="skeleton" style={{ width: 90, height: 8 }} />
        </div>
      ) : error && !fromCache ? (
        /* Hard error — no cached data available */
        <div>
          <p className="text-2xl font-bold mb-1" style={{ color: 'var(--muted)', fontFamily: "'Syne', sans-serif" }}>
            —
          </p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>⚠ Unavailable</p>
        </div>
      ) : (
        /* Normal display — includes fromCache state */
        <>
          <div className="flex items-end gap-3 flex-wrap">
            <span
              className="text-3xl font-bold leading-none"
              style={{ fontFamily: "'Syne', sans-serif", color: fromCache ? 'var(--muted)' : 'var(--text)' }}
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

            {signal && <SignalPill signal={signal} />}
          </div>

          {subLabel && (
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              {subLabel}
            </p>
          )}

          {/* 30d comparison date */}
          {!fromCache && baseDate && pctChange != null && (
            <p style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: 'var(--muted)', marginTop: 2, opacity: 0.7 }}>
              compared to {baseDate}
            </p>
          )}

          {/* Cache indicator */}
          {fromCache && (
            <p style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: '#f59e0b', marginTop: 4 }}>
              ⚠ Cached{cacheAge != null ? ` · ${cacheAge}min ago` : ''}
            </p>
          )}

          {/* Reference period */}
          {!fromCache && asOf && !isFallback && (
            <p style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, marginTop: 4 }}>
              as of {asOf}
            </p>
          )}

          {/* Static fallback badge */}
          {isFallback && !fromCache && (
            <span
              style={{
                display: 'inline-block',
                marginTop: 6,
                fontSize: 10,
                fontFamily: "'DM Mono', monospace",
                color: '#f59e0b',
                background: '#f59e0b18',
                border: '1px solid #f59e0b40',
                borderRadius: 4,
                padding: '1px 6px',
              }}
            >
              ⚠ Static fallback · as of Feb 2026
            </span>
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
    Critical: { bg: '#f87171' },
    Elevated: { bg: '#fb923c' },
    Watch:    { bg: '#6b7fa3' },
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
