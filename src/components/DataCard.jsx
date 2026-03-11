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
        className="uppercase tracking-widest mb-3"
        style={{ color: 'var(--text)', fontSize: 11, letterSpacing: '0.1em', fontWeight: 600 }}
      >
        {title}
      </p>

      {loading ? (
        <div>
          <div className="skeleton" style={{ width: 80, height: 32, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 120, height: 12, marginBottom: 4 }} />
          <div className="skeleton" style={{ width: 90, height: 10 }} />
        </div>
      ) : error && !fromCache ? (
        <div>
          <p className="text-2xl font-bold mb-1" style={{ color: 'var(--muted)' }}>—</p>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>⚠ Unavailable</p>
        </div>
      ) : (
        <>
          <div className="flex items-end gap-3 flex-wrap">
            <span
              className="text-3xl font-bold leading-none"
              style={{ color: 'var(--text)' }}
            >
              {displayValue}
            </span>

            {pctChange != null && (
              <span
                className="font-semibold px-2 py-0.5 rounded-md"
                style={{
                  fontSize: 14,
                  color: badgeColor,
                  background: `${badgeColor}20`,
                }}
              >
                {arrow} {formatPct(pctChange)}
              </span>
            )}

            {signal && <SignalPill signal={signal} />}
          </div>

          {subLabel && (
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>
              {subLabel}
            </p>
          )}

          {/* 30-day comparison date */}
          {!fromCache && baseDate && pctChange != null && (
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
              vs. {baseDate} (30-day change)
            </p>
          )}

          {/* Cache warning */}
          {fromCache && (
            <p style={{ fontSize: 13, color: 'var(--oil)', marginTop: 4 }}>
              ⚠ Cached{cacheAge != null ? ` · ${cacheAge}min ago` : ''}
            </p>
          )}

          {/* Reference date */}
          {!fromCache && asOf && !isFallback && (
            <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
              as of {asOf}
            </p>
          )}
        </>
      )}

      {note && !loading && (
        <p
          style={{ fontSize: 13, color: 'var(--muted)', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', lineHeight: 1.6 }}
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
    Critical: 'var(--negative)',
    Elevated: 'var(--accent)',
    Watch:    'var(--muted)',
  }
  const c = colors[signal] || colors.Watch
  return (
    <span
      style={{ fontSize: 13, padding: '2px 8px', borderRadius: 999, fontWeight: 600, background: `${c}22`, color: c, border: `1px solid ${c}40` }}
    >
      {signal}
    </span>
  )
}
