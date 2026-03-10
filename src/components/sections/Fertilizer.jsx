import DataCard from '../DataCard'
import LineChartWrapper from '../LineChart'

const EXPLAINER =
  'Urea front-month futures (UFB=F), CBOT. Daily close, 30-day window via Yahoo Finance. USD per metric ton.'

const WHY_TRACKED = [
  'Natural gas accounts for 70\u201380% of nitrogen fertilizer production cost.',
  'Urea is the most widely traded nitrogen fertilizer globally.',
]

export default function Fertilizer({ urea }) {
  const ureaHistory = urea?.history ?? []
  const lastDate = ureaHistory.slice(-1)[0]?.date ?? null

  return (
    <section id="fertilizer" className="mb-14">
      <div className="mb-2">
        <span
          className="text-xs uppercase tracking-widest"
          style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}
        >
          04 —
        </span>
        <h2
          className="text-lg font-bold inline ml-2"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Fertilizer
        </h2>
      </div>
      <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400, marginBottom: 20 }}>
        {EXPLAINER}
      </p>

      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <DataCard
          title="Urea Futures (UFB=F)"
          value={urea?.price}
          pctChange={urea?.pctChange}
          decimals={2}
          unit=" $/ton"
          subLabel="CBOT Urea (UFB=F) · USD/ton · daily via Yahoo Finance"
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

      {/* Urea 30d chart */}
      {ureaHistory.length > 0 && (
        <div className="card mb-4" style={{ padding: '16px 16px 8px' }}>
          <p style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, opacity: 0.7, marginBottom: 8 }}>
            Urea Futures (UFB=F) · 30d · USD/ton
          </p>
          <LineChartWrapper
            data={ureaHistory}
            lines={[{ key: 'close', color: '#4ade80', label: 'Urea' }]}
            xKey="date"
            yUnit=" $/ton"
            height={160}
          />
        </div>
      )}

      <div
        className="card"
        style={{ background: 'var(--surface2)', borderLeft: '3px solid var(--fertilizer)' }}
      >
        <p
          className="text-xs uppercase tracking-widest mb-3"
          style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}
        >
          Why tracked
        </p>
        <ul className="space-y-2">
          {WHY_TRACKED.map((point, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              <span style={{ color: 'var(--fertilizer)', flexShrink: 0 }}>·</span>
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
