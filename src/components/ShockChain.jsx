/**
 * Transmission Mechanism visual — "The Shock Chain"
 * Shows how Strait of Hormuz disruption ripples to HICP Food.
 */
export default function ShockChain({ commodityData }) {
  const { brent, ttf, bdi, mos } = commodityData || {}

  function getSignal(pct, thresholds = [5, 2]) {
    if (pct == null) return 'Watch'
    const abs = Math.abs(pct)
    if (abs >= thresholds[0]) return 'Critical'
    if (abs >= thresholds[1]) return 'Elevated'
    return 'Watch'
  }

  const nodes = [
    {
      icon: '🛢️',
      label: 'Oil / LNG',
      desc: 'Strait of Hormuz',
      signal: getSignal(brent?.pctChange),
      color: 'var(--oil)',
    },
    {
      icon: '⚡',
      label: 'EU Energy',
      desc: 'TTF Gas benchmark',
      signal: getSignal(ttf?.pctChange),
      color: 'var(--gas)',
    },
    {
      icon: '🏭',
      label: 'Production',
      desc: 'Industrial costs',
      signal: getSignal(ttf?.pctChange, [4, 1.5]),
      color: 'var(--muted)',
    },
    {
      icon: '🌾',
      label: 'Fertilizer',
      desc: 'MOS / Potash',
      signal: getSignal(mos?.pctChange),
      color: 'var(--fertilizer)',
    },
    {
      icon: '🚢',
      label: 'Shipping',
      desc: 'Baltic Dry Index',
      signal: getSignal(bdi?.pctChange),
      color: 'var(--shipping)',
    },
    {
      icon: '🛒',
      label: 'HICP Food',
      desc: 'EU inflation',
      signal: 'Elevated',  // typically lagged — use static or derive from Eurostat
      color: 'var(--food)',
    },
  ]

  const signalColors = {
    Critical: '#f87171',
    Elevated: '#fb923c',
    Watch: '#6b7fa3',
  }

  return (
    <section
      className="rounded-2xl p-6"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <p
        className="text-xs uppercase tracking-widest mb-1"
        style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}
      >
        06 — Transmission Mechanism
      </p>
      <h2
        className="text-lg font-bold mb-1"
        style={{ fontFamily: "'Syne', sans-serif" }}
      >
        The Shock Chain
      </h2>
      <p className="text-xs mb-6" style={{ color: 'var(--muted)' }}>
        How a Strait of Hormuz disruption reaches your supermarket
      </p>

      {/* Chain nodes */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {nodes.map((node, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <div className="chain-node">
              <div className="text-2xl mb-2">{node.icon}</div>
              <p
                className="text-xs font-bold mb-0.5"
                style={{ fontFamily: "'Syne', sans-serif", color: 'var(--text)' }}
              >
                {node.label}
              </p>
              <p className="text-xs mb-2" style={{ color: 'var(--muted)', fontSize: 10 }}>
                {node.desc}
              </p>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  color: signalColors[node.signal],
                  background: `${signalColors[node.signal]}20`,
                  border: `1px solid ${signalColors[node.signal]}40`,
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                }}
              >
                {node.signal}
              </span>
            </div>

            {i < nodes.length - 1 && (
              <span className="text-lg" style={{ color: 'var(--muted)', flexShrink: 0 }}>
                →
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
