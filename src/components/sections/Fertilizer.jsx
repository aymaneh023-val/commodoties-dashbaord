import DataCard from '../DataCard'
import LineChartWrapper from '../LineChart'

const EXPLAINER =
  'Urea front-month futures (UFB=F) traded on CBOT, Chicago. ' +
  'Urea is the most widely traded nitrogen fertilizer worldwide. Prices in USD per metric ton ($/ton) — 30-day daily closes via Yahoo Finance. ' +
  'Natural gas accounts for 70–80% of urea production cost, creating a direct link between gas prices and fertilizer costs.'

export default function Fertilizer({ urea }) {
  const ureaHistory = urea?.history ?? []
  const lastDate = ureaHistory.slice(-1)[0]?.date ?? null

  return (
    <section id="fertilizer" className="mb-14">
      <div className="mb-2">
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
          Fertilizer (Urea)
        </h2>
      </div>
      <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 6, lineHeight: 1.6 }}>
        {EXPLAINER}
      </p>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
        $/ton = US dollars per metric ton (1,000 kg)
      </p>

      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <DataCard
          title="Urea Futures — CBOT Chicago"
          value={urea?.price}
          pctChange={urea?.pctChange}
          decimals={2}
          unit=" $/ton"
          subLabel="Front-month urea futures (UFB=F) · USD per metric ton · daily close"
          loading={urea?.loading}
          error={urea?.error}
          inverse={false}
          asOf={lastDate}
          fromCache={urea?.fromCache}
          cacheAge={urea?.cacheAge}
          baseDate={urea?.baseDate}
          isFallback={urea?.error && urea?.price != null}
        />
      </div>

      {ureaHistory.length > 0 && (
        <div className="card mb-4" style={{ padding: '16px 16px 8px' }}>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>
            Urea Futures (UFB=F) · 30 days · USD/ton
          </p>
          <LineChartWrapper
            data={ureaHistory}
            lines={[{ key: 'close', color: 'var(--fertilizer)', label: 'Urea $/ton' }]}
            xKey="date"
            yUnit=" $/ton"
            height={160}
          />
        </div>
      )}

      <div className="card" style={{ background: 'var(--surface2)', borderLeft: '3px solid var(--fertilizer)' }}>
        <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 10 }}>
          Why tracked
        </p>
        <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>
          Fertilizer prices influence global crop production costs and agricultural yields.
        </p>
      </div>
    </section>
  )
}
