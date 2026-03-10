import DataCard from '../DataCard'
import LineChartWrapper from '../LineChart'

const WHY_IT_MATTERS = [
  'TTF (Title Transfer Facility) is the EU benchmark gas price — when it surges, energy bills for 450M Europeans follow within 1–3 months.',
  'EU imported ~100 bcm of LNG in 2024, replacing Russian pipeline gas. LNG spot prices are directly linked to global energy markets.',
  'Industrial production costs (steel, chemicals, ceramics) are highly gas-sensitive — a 30% TTF spike translates to ~8-12% margin compression for energy-intensive sectors.',
]

const EXPLAINER = 'TTF (Title Transfer Facility) is Europe\'s main natural gas benchmark, traded in the Netherlands. LNG (liquefied natural gas) is gas cooled to liquid for shipping — Europe imported ~100 bcm in 2024 to replace Russian pipeline gas.'

export default function GasLNG({ ttf, lng }) {
  const ttfHistory = ttf?.history ?? []
  const lngHistory = lng?.history ?? []

  return (
    <section id="gas" className="mb-14">
      <div className="mb-2">
        <span
          className="text-xs uppercase tracking-widest"
          style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}
        >
          02 —
        </span>
        <h2
          className="text-lg font-bold inline ml-2"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Gas &amp; LNG
        </h2>
      </div>
      <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400, marginBottom: 20 }}>
        {EXPLAINER}
      </p>

      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <DataCard
          title="TTF Natural Gas"
          value={ttf?.price}
          pctChange={ttf?.pctChange}
          decimals={2}
          unit=" €/MWh"
          subLabel="Dutch TTF futures · EU gas benchmark"
          loading={ttf?.loading}
          error={ttf?.error}
          inverse={false}
          asOf={ttfHistory.slice(-1)[0]?.date ?? null}
          fromCache={ttf?.fromCache}
          cacheAge={ttf?.cacheAge}
          isFallback={ttf?.error && ttf?.price != null}
        />
        <DataCard
          title="LNG (Cheniere Energy)"
          value={lng?.price}
          pctChange={lng?.pctChange}
          decimals={2}
          unit=" $"
          subLabel="LNG equity proxy · NYSE"
          loading={lng?.loading}
          error={lng?.error}
          inverse={false}
          asOf={lngHistory.slice(-1)[0]?.date ?? null}
          fromCache={lng?.fromCache}
          cacheAge={lng?.cacheAge}
          isFallback={lng?.error && lng?.price != null}
        />
      </div>

      {/* Two side-by-side charts */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {ttfHistory.length > 0 && (
          <div className="card" style={{ padding: '16px 16px 8px' }}>
            <p style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, opacity: 0.7, marginBottom: 8 }}>
              TTF Natural Gas · 30d · €/MWh
            </p>
            <LineChartWrapper
              data={ttfHistory}
              lines={[{ key: 'close', color: '#38bdf8', label: 'TTF' }]}
              xKey="date"
              yUnit=" €/MWh"
              height={160}
            />
          </div>
        )}
        {lngHistory.length > 0 && (
          <div className="card" style={{ padding: '16px 16px 8px' }}>
            <p style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, opacity: 0.7, marginBottom: 8 }}>
              LNG (Cheniere) · 30d · USD
            </p>
            <LineChartWrapper
              data={lngHistory}
              lines={[{ key: 'close', color: 'rgba(56,189,248,0.6)', label: 'LNG' }]}
              xKey="date"
              yUnit=" $"
              height={160}
            />
          </div>
        )}
      </div>

      <div
        className="card"
        style={{ background: 'var(--surface2)', borderLeft: '3px solid var(--gas)' }}
      >
        <p
          className="text-xs uppercase tracking-widest mb-3"
          style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}
        >
          Why this matters for Europe
        </p>
        <ul className="space-y-2">
          {WHY_IT_MATTERS.map((point, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              <span style={{ color: 'var(--gas)', flexShrink: 0 }}>·</span>
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
