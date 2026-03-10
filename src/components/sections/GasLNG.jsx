import DataCard from '../DataCard'

const WHY_IT_MATTERS = [
  'TTF (Title Transfer Facility) is the EU benchmark gas price — when it surges, energy bills for 450M Europeans follow within 1–3 months.',
  'EU imported ~100 bcm of LNG in 2024, replacing Russian pipeline gas. LNG spot prices are directly linked to global energy markets.',
  'Industrial production costs (steel, chemicals, ceramics) are highly gas-sensitive — a 30% TTF spike translates to ~8-12% margin compression for energy-intensive sectors.',
]

export default function GasLNG({ ttf, lng }) {
  return (
    <section id="gas" className="mb-10">
      <div className="mb-4">
        <span
          className="text-xs uppercase tracking-widest"
          style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}
        >
          02 —
        </span>
        <h2
          className="text-lg font-bold inline ml-2"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Gas &amp; LNG
        </h2>
      </div>

      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <DataCard
          title="TTF Natural Gas"
          value={ttf?.price}
          pctChange={ttf?.pctChange}
          decimals={2}
          unit=" €/MWh"
          subLabel="Dutch TTF futures · EU gas benchmark"
          loading={ttf?.loading}
          error={ttf?.error}
          inverse={false}
        />
        <DataCard
          title="LNG (Cheniere Energy)"
          value={lng?.price}
          pctChange={lng?.pctChange}
          decimals={2}
          unit=" $"
          subLabel="LNG equity proxy · NYSE"
          loading={lng?.loading}
          error={lng?.error}
          inverse={false}
        />
      </div>

      {/* Why this matters */}
      <div
        className="card"
        style={{ background: 'var(--surface2)' }}
      >
        <p
          className="text-xs uppercase tracking-widest mb-3"
          style={{ color: 'var(--gas)', fontFamily: "'DM Mono', monospace" }}
        >
          ⚡ Why this matters for Europe
        </p>
        <ul className="space-y-2">
          {WHY_IT_MATTERS.map((point, i) => (
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
