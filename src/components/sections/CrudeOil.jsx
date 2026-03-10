import DataCard from '../DataCard'
import LineChartWrapper from '../LineChart'

const EXPLAINER = 'Brent is the global benchmark priced in London, used for ~70% of world oil contracts. WTI is the US benchmark, typically $2–4 cheaper than Brent. Both spiked after US-Iran hostilities began.'

export default function CrudeOil({ brent, wti }) {
  const lastDate = brent?.history?.slice(-1)[0]?.date ?? null
  const chartStart = brent?.history?.[0]?.date

  // Merge Brent + WTI history by index (same timestamps from Yahoo Finance)
  const combinedHistory = brent?.history?.map((b, i) => ({
    date: b.date,
    brent: b.close,
    wti: wti?.history?.[i]?.close ?? null,
  })) ?? []

  return (
    <section id="oil" className="mb-14">
      <div className="mb-2">
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
      <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400, marginBottom: 20 }}>
        {EXPLAINER}
      </p>

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
          asOf={lastDate}
          isFallback={brent?.error && brent?.price != null}
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
          asOf={wti?.history?.slice(-1)[0]?.date ?? null}
          isFallback={wti?.error && wti?.price != null}
        />
      </div>

      {combinedHistory.length > 0 && (
        <div className="card" style={{ padding: '16px 16px 8px' }}>
          {chartStart && lastDate && (
            <p style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, opacity: 0.7, marginBottom: 8 }}>
              Period: {chartStart} – {lastDate}
            </p>
          )}
          <LineChartWrapper
            data={combinedHistory}
            lines={[
              { key: 'brent', color: '#f59e0b', label: 'Brent' },
              { key: 'wti',   color: '#6b7fa3', label: 'WTI', dashed: true },
            ]}
            xKey="date"
            yUnit=" $/bbl"
            height={160}
            showLegend={true}
          />
        </div>
      )}
    </section>
  )
}
