import DataCard from '../DataCard'

const FLOW_STEPS = [
  { icon: '⚡', label: 'Gas ↑', color: 'var(--gas)' },
  { icon: '🏭', label: 'Fertilizer ↑', color: 'var(--fertilizer)' },
  { icon: '🌱', label: 'Food Production Costs ↑', color: 'var(--oil)' },
  { icon: '📊', label: 'HICP Food ↑', color: 'var(--food)' },
]

export default function Fertilizer({ mos }) {
  return (
    <section id="fertilizer" className="mb-10">
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
        />

        <div className="card" style={{ background: 'var(--surface2)' }}>
          <p
            className="text-xs uppercase tracking-widest mb-3"
            style={{ color: 'var(--fertilizer)', fontFamily: "'DM Mono', monospace" }}
          >
            🌾 Supply Chain Context
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

      {/* Visual flow chain */}
      <div
        className="card"
        style={{ background: 'var(--surface2)' }}
      >
        <p
          className="text-xs uppercase tracking-widest mb-4"
          style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}
        >
          Transmission chain
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          {FLOW_STEPS.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="flex flex-col items-center"
                style={{ minWidth: 80 }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-1 text-lg"
                  style={{ background: `${step.color}20`, border: `1px solid ${step.color}40` }}
                >
                  {step.icon}
                </div>
                <p
                  className="text-xs text-center leading-tight"
                  style={{ color: step.color, fontFamily: "'DM Mono', monospace", maxWidth: 80 }}
                >
                  {step.label}
                </p>
              </div>
              {i < FLOW_STEPS.length - 1 && (
                <span className="text-xl" style={{ color: 'var(--muted)' }}>→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
