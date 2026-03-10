import DataCard from '../DataCard'
import LineChartWrapper from '../LineChart'

export default function CrudeOil({ brent, wti }) {
  return (
    <section id="oil" className="mb-10">
      <div className="mb-4">
        <span
          className="text-xs uppercase tracking-widest"
          style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}
        >
          01 —
        </span>
        <h2
          className="text-lg font-bold inline ml-2"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Crude Oil
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <DataCard
          title="Brent Crude"
          value={brent?.price}
          pctChange={brent?.pctChange}
          decimals={2}
          unit=" $/bbl"
          subLabel="ICE Brent Futures · USD/bbl"
          loading={brent?.loading}
          error={brent?.error}
          inverse={false}
        />
        <DataCard
          title="WTI Crude"
          value={wti?.price}
          pctChange={wti?.pctChange}
          decimals={2}
          unit=" $/bbl"
          subLabel="NYMEX WTI Futures · USD/bbl"
          loading={wti?.loading}
          error={wti?.error}
          inverse={false}
        />
      </div>

      {/* 30-day Brent chart */}
      {brent?.history?.length > 0 && (
        <div
          className="card"
          style={{ padding: '16px 16px 8px' }}
        >
          <p
            className="text-xs mb-3"
            style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}
          >
            Brent 30-Day Price History · USD/bbl
          </p>
          <LineChartWrapper
            data={brent.history}
            lines={[{ key: 'close', color: 'var(--oil)', label: 'Brent' }]}
            xKey="date"
            yUnit=" $/bbl"
            height={200}
          />
        </div>
      )}
    </section>
  )
}
