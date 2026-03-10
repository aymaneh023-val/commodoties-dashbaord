import DataCard from '../DataCard'
import LineChartWrapper from '../LineChart'

const EXPLAINER = 'The Baltic Dry Index tracks the cost of shipping raw materials globally. A rising BDI signals higher demand or supply chain stress — it often leads commodity price moves by 2–4 weeks.'

function getBDISignal(price) {
  if (price == null) return null
  if (price > 2000) return 'Critical'
  if (price > 1500) return 'Elevated'
  return 'Watch'
}

export default function Shipping({ bdi }) {
  const signal = getBDISignal(bdi?.price)
  const lastDate = bdi?.history?.slice(-1)[0]?.date ?? null
  const chartStart = bdi?.history?.[0]?.date

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

      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <DataCard
          title="Baltic Dry Index"
          value={bdi?.price}
          pctChange={bdi?.pctChange}
          decimals={0}
          unit=""
          subLabel="Global dry bulk shipping cost benchmark"
          loading={bdi?.loading}
          error={bdi?.error}
          inverse={true}
          signal={signal}
          asOf={lastDate}
          isFallback={bdi?.error && bdi?.price != null}
        />

        <div
          className="card"
          style={{ background: 'var(--surface2)', borderLeft: '3px solid var(--shipping)' }}
        >
          <p
            className="text-xs uppercase tracking-widest mb-3"
            style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}
          >
            Supply Chain Disruption Risk
          </p>
          <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--muted)' }}>
            <strong style={{ color: 'var(--text)' }}>Strait of Hormuz:</strong> ~21% of global oil and 20% of LNG transits this chokepoint. A closure adds 14-21 days via Cape of Good Hope detour.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            <strong style={{ color: 'var(--text)' }}>Red Sea:</strong> Houthi attacks rerouted ~90% of Asia-EU container traffic via Africa, adding $2,000-4,000/container and 10-14 days.
          </p>
        </div>
      </div>

      {bdi?.history?.length > 0 && (
        <div className="card" style={{ padding: '16px 16px 8px' }}>
          {chartStart && lastDate && (
            <p style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, opacity: 0.7, marginBottom: 8 }}>
              Period: {chartStart} – {lastDate}
            </p>
          )}
          <LineChartWrapper
            data={bdi.history}
            lines={[{ key: 'close', color: '#818cf8', label: 'BDI' }]}
            xKey="date"
            yUnit=""
            height={160}
            referenceLines={[
              { value: 1500, label: 'Elevated', color: '#6b7fa3' },
              { value: 2000, label: 'Critical',  color: '#6b7fa3' },
            ]}
          />
        </div>
      )}
    </section>
  )
}
