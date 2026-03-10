import DataCard from '../DataCard'
import LineChartWrapper from '../LineChart'

const EXPLAINER =
  'Shipping cost proxies via Yahoo Finance. BDRY is an ETF that tracks the Baltic Dry Index (dry bulk freight). ' +
  'ZIM is an Israeli container shipping stock used as a container freight proxy. Both are equity prices, not freight rates directly.'

const CHOKEPOINTS = [
  {
    id: 'hormuz',
    name: 'Strait of Hormuz',
    defaultStatus: 'CONSTRAINED',
    note: 'Handles ~21% of global oil and 20% of LNG. A closure would add 14–21 days via Cape of Good Hope detour.',
  },
  {
    id: 'bab',
    name: 'Bab-el-Mandeb',
    defaultStatus: 'REDUCED',
    note: '~90% of Asia-EU container traffic rerouted via Africa since late 2023. Adds $2,000–4,000/container and 10–14 days.',
  },
  {
    id: 'suez',
    name: 'Suez Canal',
    defaultStatus: 'NORMAL',
    note: '12% of global trade. Transit volumes down ~50% since late 2023.',
  },
  {
    id: 'persian',
    name: 'Persian Gulf Lanes',
    defaultStatus: 'ELEVATED',
    note: 'Primary export corridor for Gulf-state oil. Maritime insurance premiums elevated.',
  },
]

const STATUS_STYLE = {
  CONSTRAINED: { color: '#f87171', label: 'Constrained' },
  REDUCED:     { color: '#f59e0b', label: 'Reduced' },
  ELEVATED:    { color: '#818cf8', label: 'Elevated' },
  NORMAL:      { color: '#6b7280', label: 'Normal' },
}

const PORTWATCH_KEY_MAP = {
  hormuz:  ['hormuz', 'strait of hormuz'],
  bab:     ['bab', 'bab-el-mandeb', 'bab el mandeb', 'mandeb'],
  suez:    ['suez'],
  persian: ['persian', 'persian gulf'],
}

function getPortWatchStatus(deviation) {
  if (deviation == null) return null
  if (deviation < -40) return 'CONSTRAINED'
  if (deviation < -25) return 'REDUCED'
  if (deviation < -10) return 'ELEVATED'
  return 'NORMAL'
}

export default function Shipping({ bdry, zim, portwatch = null }) {
  const bdryHistory = bdry?.history ?? []
  const zimHistory  = zim?.history  ?? []

  // Enrich chokepoints with live PortWatch data
  const enrichedChokepoints = CHOKEPOINTS.map((cp) => {
    if (!portwatch) return { ...cp, status: cp.defaultStatus }
    const pwKeys = PORTWATCH_KEY_MAP[cp.id] || []
    const pwEntry = Object.entries(portwatch).find(([key]) =>
      pwKeys.some((k) => key.toLowerCase().includes(k))
    )
    if (!pwEntry) return { ...cp, status: cp.defaultStatus }
    const [, pw] = pwEntry
    const liveStatus = getPortWatchStatus(pw.deviation)
    return {
      ...cp,
      status: liveStatus ?? cp.defaultStatus,
      vesselCount: pw.vesselCount ?? null,
      deviation: pw.deviation ?? null,
      isLive: true,
    }
  })

  return (
    <section id="shipping" className="mb-14">
      <div className="mb-2">
        <span
          className="text-xs uppercase tracking-widest"
          style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}
        >
          06 —
        </span>
        <h2
          className="text-lg font-bold inline ml-2"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Shipping &amp; Containers
        </h2>
      </div>
      <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400, marginBottom: 20 }}>
        {EXPLAINER}
      </p>

      {/* Data cards */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <DataCard
          title="Dry Bulk Shipping (BDRY)"
          value={bdry?.price}
          pctChange={bdry?.pctChange}
          decimals={2}
          unit=" $"
          subLabel="Proxy: ETF share price tracking Baltic Dry Index"
          loading={bdry?.loading}
          error={bdry?.error}
          inverse={false}
          asOf={bdryHistory.slice(-1)[0]?.date ?? null}
          fromCache={bdry?.fromCache}
          cacheAge={bdry?.cacheAge}
          baseDate={bdry?.baseDate}
        />
        <DataCard
          title="Container Shipping (ZIM)"
          value={zim?.price}
          pctChange={zim?.pctChange}
          decimals={2}
          unit=" $"
          subLabel="Proxy: Stock price correlated with container freight rates"
          loading={zim?.loading}
          error={zim?.error}
          inverse={false}
          asOf={zimHistory.slice(-1)[0]?.date ?? null}
          fromCache={zim?.fromCache}
          cacheAge={zim?.cacheAge}
          baseDate={zim?.baseDate}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {bdryHistory.length > 0 && (
          <div className="card" style={{ padding: '16px 16px 8px' }}>
            <p style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, opacity: 0.7, marginBottom: 8 }}>
              BDRY · 30d · USD
            </p>
            <LineChartWrapper
              data={bdryHistory}
              lines={[{ key: 'close', color: '#818cf8', label: 'BDRY' }]}
              xKey="date"
              yUnit=" $"
              height={160}
            />
          </div>
        )}
        {zimHistory.length > 0 && (
          <div className="card" style={{ padding: '16px 16px 8px' }}>
            <p style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, opacity: 0.7, marginBottom: 8 }}>
              ZIM · 30d · USD
            </p>
            <LineChartWrapper
              data={zimHistory}
              lines={[{ key: 'close', color: '#818cf8', label: 'ZIM' }]}
              xKey="date"
              yUnit=" $"
              height={160}
            />
          </div>
        )}
      </div>

      {/* Key Shipping Routes */}
      <div className="mb-4">
        <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>
          Key Shipping Routes
        </p>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {enrichedChokepoints.map((cp) => {
            const style = STATUS_STYLE[cp.status] ?? STATUS_STYLE.NORMAL
            return (
              <div
                key={cp.id}
                className="card"
                style={{ padding: '14px 16px', borderLeft: `3px solid ${style.color}` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: style.color, flexShrink: 0 }} />
                  <strong className="text-sm" style={{ color: 'var(--text)' }}>{cp.name}</strong>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded ml-auto"
                    style={{ color: style.color, background: `${style.color}18`, fontFamily: "'DM Mono', monospace", fontSize: 10 }}
                  >
                    {style.label}
                  </span>
                </div>
                {cp.isLive && (cp.vesselCount != null || cp.deviation != null) && (
                  <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>
                    {cp.vesselCount != null ? `${cp.vesselCount} vessels` : ''}
                    {cp.vesselCount != null && cp.deviation != null ? ' · ' : ''}
                    {cp.deviation != null ? `${cp.deviation > 0 ? '+' : ''}${cp.deviation.toFixed(1)}% vs 30d avg` : ''}
                  </p>
                )}
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{cp.note}</p>
              </div>
            )
          })}
        </div>
        <p className="mt-3" style={{ fontSize: 10, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", opacity: 0.7 }}>
          {portwatch
            ? 'Source: IMF PortWatch · vessel transit data updated weekly'
            : 'Route status based on latest available assessment'}
        </p>
      </div>

      {/* Note */}
      <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", opacity: 0.7 }}>
        Note: BDRY and ZIM are stock market proxies — their share prices correlate with shipping rate indices but are not the indices themselves.
      </p>
    </section>
  )
}
