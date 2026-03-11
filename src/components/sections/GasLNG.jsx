import DataCard from '../DataCard'
import LineChartWrapper from '../LineChart'

const EXPLAINER = 'TTF (Title Transfer Facility) front-month futures (TTF=F). Traded on ICE Endex, the Netherlands. Daily close, 30-day window via Yahoo Finance. EUR per MWh.'

const WHY_TRACKED = [
  'European industrial energy costs are primarily driven by TTF.',
  'Gas price changes affect production costs for energy-intensive goods and nitrogen fertilizer.',
]

export default function GasLNG({ ttf }) {
  const ttfHistory = ttf?.history ?? []

  return (
    <section id="gas" className="mb-14">
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
          European Gas
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
          subLabel="ICE Endex TTF (TTF=F) · EUR/MWh · daily via Yahoo Finance"
          loading={ttf?.loading}
          error={ttf?.error}
          inverse={false}
          asOf={ttfHistory.slice(-1)[0]?.date ?? null}
          fromCache={ttf?.fromCache}
          cacheAge={ttf?.cacheAge}
          baseDate={ttf?.baseDate}
          isFallback={ttf?.error && ttf?.price != null}
        />
      </div>

      {ttfHistory.length > 0 && (
        <div className="card mb-4" style={{ padding: '16px 16px 8px' }}>
          <p style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, opacity: 0.7, marginBottom: 8 }}>
            TTF Natural Gas · 30d · €/MWh
          </p>
          <LineChartWrapper
            data={ttfHistory}
            lines={[{ key: 'close', color: '#3448BF', label: 'TTF' }]}
            xKey="date"
            yUnit=" €/MWh"
            height={160}
          />
        </div>
      )}

      <div
        className="card"
        style={{ background: 'var(--surface2)', borderLeft: '3px solid var(--gas)' }}
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
              <span style={{ color: 'var(--gas)', flexShrink: 0 }}>·</span>
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
