import DataCard from '../DataCard'
import LineChartWrapper from '../LineChart'

const EXPLAINER =
  'Brent crude (BZ=F) is the global benchmark for oil pricing, set daily on ICE London. ' +
  'Shown here: front-month futures, daily close, 30-day window. Prices in USD per barrel ($/bbl). ' +
  'Brent directly determines European fuel, heating oil, and petrochemical input costs.'

export default function CrudeOil({ brent }) {
  const brentHistory = brent?.history ?? []
  const lastDate = brentHistory.slice(-1)[0]?.date ?? null
  const chartStart = brentHistory[0]?.date

  return (
    <section id="oil" className="mb-14">
      <div className="mb-2">
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
          Crude Oil
        </h2>
      </div>
      <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 6, lineHeight: 1.6 }}>
        {EXPLAINER}
      </p>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
        $/bbl = US dollars per barrel · 1 barrel ≈ 159 litres
      </p>

      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <DataCard
          title="Brent Crude — ICE London"
          value={brent?.price}
          pctChange={brent?.pctChange}
          decimals={2}
          unit=" $/bbl"
          subLabel="Front-month futures (BZ=F) · USD per barrel · daily close"
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
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>
              Brent Crude (BZ=F) · {chartStart} – {lastDate} · USD/bbl
            </p>
          )}
          <LineChartWrapper
            data={brentHistory}
            lines={[{ key: 'close', color: 'var(--oil)', label: 'Brent $/bbl' }]}
            xKey="date"
            yUnit=" $/bbl"
            height={160}
          />
        </div>
      )}

      <div
        className="mt-4 px-4 py-3 rounded-xl"
        style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderLeft: '3px solid var(--oil)', fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}
      >
        <strong>Why tracked:</strong>{' '}
        Oil prices influence transport, packaging, fertilizer, and energy costs across food supply chains.
      </div>
    </section>
  )
}
