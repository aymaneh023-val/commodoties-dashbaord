const CHOKEPOINT_LABELS = {
  hormuz: 'Hormuz',
  bab:    'Bab el-Mandeb',
  suez:   'Suez',
}

const STATUS_STYLES = {
  NORMAL:    { color: '#4ade80', label: 'Normal' },
  WATCH:     { color: '#f59e0b', label: 'Watch' },
  DISRUPTED: { color: '#f87171', label: 'Disrupted' },
  CRITICAL:  { color: '#ef4444', label: 'Critical' },
}

export default function ContextRow({ gprValue, gprStatus, gprError, portwatch }) {
  return (
    <div
      className="px-6 py-2 flex items-center gap-6 overflow-x-auto"
      style={{
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        scrollbarWidth: 'none',
      }}
    >
      {/* GPR compact */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="text-xs uppercase tracking-wider"
          style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10 }}
        >
          GPR
        </span>
        {gprError && gprValue == null ? (
          <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>
            unavailable
          </span>
        ) : (
          <>
            <span
              className="text-xs font-medium"
              style={{
                fontFamily: "'Syne', sans-serif",
                color: gprStatus?.color ?? 'var(--muted)',
                fontSize: 13,
              }}
            >
              {gprValue != null ? Math.round(gprValue) : '—'}
            </span>
            {gprStatus && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  color: gprStatus.color,
                  background: `${gprStatus.color}15`,
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                }}
              >
                {gprStatus.label}
              </span>
            )}
          </>
        )}
      </div>

      <span style={{ color: 'var(--border)', userSelect: 'none', fontSize: 10 }}>|</span>

      {/* Chokepoint statuses */}
      <div className="flex items-center gap-4 shrink-0">
        <span
          className="text-xs uppercase tracking-wider"
          style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10 }}
        >
          Routes
        </span>
        {portwatch ? (
          Object.entries(CHOKEPOINT_LABELS).map(([id, label]) => {
            const data = portwatch[id]
            const st = data?.status ? STATUS_STYLES[data.status] : null
            return (
              <div key={id} className="flex items-center gap-1.5 shrink-0">
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: st?.color ?? 'var(--muted)',
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap' }}>
                  {label}
                </span>
                {st && (
                  <span style={{ fontSize: 10, color: st.color, fontFamily: "'DM Mono', monospace" }}>
                    {st.label}
                  </span>
                )}
              </div>
            )
          })
        ) : (
          <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>
            Loading…
          </span>
        )}
      </div>
    </div>
  )
}
