import DataCard from '../DataCard'
import LineChartWrapper from '../LineChart'

const EXPLAINER =
  'Shipping cost proxies via Yahoo Finance. BDRY is an ETF that tracks the Baltic Dry Index (dry bulk freight). ' +
  'ZIM is an Israeli container shipping stock used as a container freight proxy. Both are equity prices, not freight rates directly.'

export default function Shipping({ bdry, zim }) {
  const bdryHistory = bdry?.history ?? []
  const zimHistory  = zim?.history  ?? []

  return (
    <section id="shipping" className="mb-14">
      <div className="mb-2">
        <span
          className="text-xs uppercase tracking-widest"
          style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}
        >
          05 —
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

      {/* Note */}
      <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", opacity: 0.7 }}>
        Note: BDRY and ZIM are stock market proxies — their share prices correlate with shipping rate indices but are not the indices themselves.
      </p>
    </section>
  )
}
