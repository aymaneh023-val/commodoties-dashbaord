import {
  LineChart, Line, ResponsiveContainer, Tooltip, YAxis,
} from 'recharts'

const HISTORICAL_AVG = 100 // GPR long-run mean 1985-2020

const EXPLAINER =
  'Measures geopolitical risk via newspaper text mining across 10 major papers. Values above 150 historically ' +
  'precede commodity price spikes by 2–4 weeks. Source: Caldara & Iacoviello (2022), American Economic Review 112(4).'

export default function RiskIndicators({ gprHistory, gprValue, gprStatus, gprFallback }) {
  const chartData = gprHistory.map(d => ({ month: d.month, value: d.value }))

  return (
    <section id="risk" className="mb-14">
      <div className="mb-2">
        <span
          className="text-xs uppercase tracking-widest"
          style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}
        >
          00 —
        </span>
        <h2
          className="text-lg font-bold inline ml-2"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Risk Indicators
        </h2>
        {gprFallback && (
          <span
            className="ml-3 text-xs px-2 py-0.5 rounded"
            style={{ color: '#6b7280', background: '#6b728018', fontFamily: "'DM Mono', monospace" }}
          >
            ⚠ Estimated
          </span>
        )}
      </div>
      <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400, marginBottom: 20 }}>
        {EXPLAINER}
      </p>

      <div className="card">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          {/* Left: value + status */}
          <div>
            <p
              className="text-xs uppercase tracking-widest mb-3"
              style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}
            >
              Geopolitical Risk Index (GPR)
            </p>
            <div className="flex items-end gap-3 mb-2">
              <span
                className="text-4xl font-bold leading-none"
                style={{ fontFamily: "'Syne', sans-serif", color: gprStatus?.color ?? 'var(--text)' }}
              >
                {gprValue != null ? Math.round(gprValue) : '—'}
              </span>
              {gprStatus && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium mb-1"
                  style={{
                    color: gprStatus.color,
                    background: `${gprStatus.color}20`,
                    border: `1px solid ${gprStatus.color}50`,
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  {gprStatus.label}
                </span>
              )}
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>
              Historical avg (1985–2020): {HISTORICAL_AVG}
            </p>
            {/* Threshold legend */}
            <div className="mt-4 space-y-1">
              {[
                { color: '#f87171', label: '> 200  CRITICAL' },
                { color: '#f59e0b', label: '> 150  ELEVATED' },
                { color: '#818cf8', label: '> 100  MODERATE' },
                { color: '#4ade80', label: '≤ 100  NORMAL' },
              ].map(t => (
                <div key={t.label} className="flex items-center gap-2">
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>
                    {t.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: 12m sparkline */}
          {chartData.length > 0 && (
            <div style={{ flex: 1, minWidth: 200, minHeight: 100 }}>
              <p style={{ fontSize: 10, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", opacity: 0.7, marginBottom: 6 }}>
                GPR · 12-month history
              </p>
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip content={<GPRTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={gprStatus?.color ?? '#818cf8'}
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 3, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function GPRTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '6px 10px',
        fontFamily: "'DM Mono', monospace",
        fontSize: 11,
        color: 'var(--text)',
      }}
    >
      <p style={{ color: 'var(--muted)' }}>{payload[0]?.payload?.month}</p>
      <p>GPR: {Math.round(payload[0]?.value ?? 0)}</p>
    </div>
  )
}
