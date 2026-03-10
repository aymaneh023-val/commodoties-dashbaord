import DataCard from '../DataCard'
import LineChartWrapper from '../LineChart'

const EXPLAINER = 'Brent crude futures (BZ=F), ICE London. Front-month contract, daily close, 30-day window via Yahoo Finance. USD per barrel.'

export default function CrudeOil({ brent }) {
  const brentHistory = brent?.history ?? []
  const lastDate = brentHistory.slice(-1)[0]?.date ?? null
  const chartStart = brentHistory[0]?.date

  return (
    <section id="oil" className="mb-14">
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
          Crude Oil
        </h2>
      </div>
      <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400, marginBottom: 20 }}>
        {EXPLAINER}
      </p>

      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <DataCard
          title="Brent Crude"
          value={brent?.price}
          pctChange={brent?.pctChange}
          decimals={2}
          unit=" $/bbl"
          subLabel="ICE Brent (BZ=F) · USD/bbl · daily via Yahoo Finance"
          loading={brent?.loading}
          error={brent?.error}
          inverse={false}
          asOf={lastDate}
          fromCache={brent?.fromCache}
          cacheAge={brent?.cacheAge}
          baseDate={brent?.baseDate}
          isFallback={brent?.error && brent?.price != null}
        />
      </div>

      {brentHistory.length > 0 && (
        <div className="card" style={{ padding: '16px 16px 8px' }}>
          {chartStart && lastDate && (
            <p style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, opacity: 0.7, marginBottom: 8 }}>
              Period: {chartStart} – {lastDate}
            </p>
          )}
          <LineChartWrapper
            data={brentHistory}
            lines={[
              { key: 'close', color: '#f59e0b', label: 'Brent' },
            ]}
            xKey="date"
            yUnit=" $/bbl"
            height={160}
          />
        </div>
      )}
    </section>
  )
}
