import DataCard from '../DataCard'

export default function Fertilizer({ mos }) {
  const asOf = mos?.history?.slice(-1)[0]?.date ?? null

  return (
    <section id="fertilizer" className="mb-14">
      <div className="mb-4">
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

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
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
          asOf={asOf}
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
    </section>
  )
}
