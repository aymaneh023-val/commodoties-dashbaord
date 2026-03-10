import DataCard from '../DataCard'
import LineChartWrapper from '../LineChart'

const EXPLAINER = 'The Baltic Dry Index tracks the cost of shipping raw materials globally. A rising BDI signals higher demand or supply chain stress — it often leads commodity price moves by 2–4 weeks.'

export default function Shipping({ bdry, zim, matx }) {
  const bdryHistory = bdry?.history ?? []
  const zimHistory  = zim?.history  ?? []

  return (
    <section id="shipping" className="mb-14">
      <div className="mb-2">
        <span
          className="text-xs uppercase tracking-widest"
          style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}
        >
          03 —
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

      {/* Three cards */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <DataCard
          title="Dry Bulk Shipping"
          value={bdry?.price}
          pctChange={bdry?.pctChange}
          decimals={2}
          unit=" $"
          subLabel="BDRY ETF · Baltic Dry proxy · USD"
          loading={bdry?.loading}
          error={bdry?.error}
          inverse={false}
          asOf={bdryHistory.slice(-1)[0]?.date ?? null}
          fromCache={bdry?.fromCache}
          cacheAge={bdry?.cacheAge}
          baseDate={bdry?.baseDate}
          isFallback={bdry?.error && bdry?.price != null}
        />
        <DataCard
          title="Container Shipping"
          value={zim?.price}
          pctChange={zim?.pctChange}
          decimals={2}
          unit=" $"
          subLabel="ZIM Integrated · container rates proxy"
          loading={zim?.loading}
          error={zim?.error}
          inverse={false}
          asOf={zimHistory.slice(-1)[0]?.date ?? null}
          fromCache={zim?.fromCache}
          cacheAge={zim?.cacheAge}
          baseDate={zim?.baseDate}
          isFallback={zim?.error && zim?.price != null}
        />
        <DataCard
          title="Container Shipping (2)"
          value={matx?.price}
          pctChange={matx?.pctChange}
          decimals={2}
          unit=" $"
          subLabel="Matson · Pacific container carrier"
          loading={matx?.loading}
          error={matx?.error}
          inverse={false}
          asOf={matx?.history?.slice(-1)[0]?.date ?? null}
          fromCache={matx?.fromCache}
          cacheAge={matx?.cacheAge}
          baseDate={matx?.baseDate}
          isFallback={matx?.error && matx?.price != null}
        />
      </div>

      {/* Two charts side by side */}
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

      {/* Context card */}
      <div
        className="card mb-4"
        style={{ background: 'var(--surface2)', borderLeft: '3px solid var(--shipping)' }}
      >
        <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>
          Supply Chain Disruption Risk
        </p>
        <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--muted)' }}>
          <strong style={{ color: 'var(--text)' }}>Strait of Hormuz:</strong> ~21% of global oil and 20% of LNG transits this chokepoint. A closure adds 14-21 days via Cape of Good Hope detour.
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
          <strong style={{ color: 'var(--text)' }}>Red Sea:</strong> Houthi attacks rerouted ~90% of Asia-EU container traffic via Africa, adding $2,000-4,000/container and 10-14 days.
        </p>
      </div>

      {/* Proxy note */}
      <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", opacity: 0.7 }}>
        Note: BDRY, ZIM and MATX are equity proxies for shipping rates. They correlate strongly with the Baltic Dry Index and Freightos container indices but are not the indices themselves.
      </p>
    </section>
  )
}
