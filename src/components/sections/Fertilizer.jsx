import DataCard from '../DataCard'
import LineChartWrapper from '../LineChart'

const EXPLAINER = 'Mosaic Co. (MOS) is one of the world\'s largest fertilizer producers. Its stock price is a reliable proxy for global fertilizer costs, which are 70–80% driven by natural gas prices.'

export default function Fertilizer({ mos }) {
  const mosHistory = mos?.history ?? []
  const lastDate = mosHistory.slice(-1)[0]?.date ?? null
  const chartStart = mosHistory[0]?.date

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
          title="Mosaic Co. (MOS)"
          value={mos?.price}
          pctChange={mos?.pctChange}
          decimals={2}
          unit=" $"
          subLabel="Fertilizer proxy · NYSE · USD"
          loading={mos?.loading}
          error={mos?.error}
          inverse={false}
          asOf={lastDate}
          fromCache={mos?.fromCache}
          cacheAge={mos?.cacheAge}
          baseDate={mos?.baseDate}
          isFallback={mos?.error && mos?.price != null}
        />

        <div
          className="card"
          style={{ background: 'var(--surface2)', borderLeft: '3px solid var(--fertilizer)' }}
        >
          <p
            className="text-xs uppercase tracking-widest mb-3"
            style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}
          >
            Supply Chain Context
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            Natural gas accounts for{' '}
            <strong style={{ color: 'var(--text)' }}>70–80%</strong> of nitrogen
            fertilizer production cost. A gas price spike flows directly into
            fertilizer prices, then into agricultural input costs, then into
            EU food inflation (HICP Food).
          </p>
        </div>
      </div>

      {mosHistory.length > 0 && (
        <div className="card" style={{ padding: '16px 16px 8px' }}>
          {chartStart && lastDate && (
            <p style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, opacity: 0.7, marginBottom: 8 }}>
              Period: {chartStart} – {lastDate}
            </p>
          )}
          <LineChartWrapper
            data={mosHistory}
            lines={[{ key: 'close', color: '#4ade80', label: 'MOS' }]}
            xKey="date"
            yUnit=" $"
            height={160}
          />
        </div>
      )}
    </section>
  )
}
