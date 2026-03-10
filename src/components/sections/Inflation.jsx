import DataCard from '../DataCard'
import LineChartWrapper from '../LineChart'
import { formatPct, pctColor, pctArrow } from '../../utils/formatters'

export default function Inflation({ headline, food, combined, isFallback }) {
  const headlineLatest = headline?.latest
  const foodLatest = food?.latest

  // Derive pct change as difference from previous month for display
  function getMoMChange(data, latest) {
    if (!data || data.length < 2) return null
    const prev = data[data.length - 2]?.value
    const curr = latest?.value
    if (prev == null || curr == null) return null
    return curr - prev  // in percentage points
  }

  const headlineMoM = getMoMChange(headline?.data, headlineLatest)
  const foodMoM = getMoMChange(food?.data, foodLatest)

  return (
    <section id="inflation" className="mb-10">
      <div className="mb-4">
        <span
          className="text-xs uppercase tracking-widest"
          style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}
        >
          05 —
        </span>
        <h2
          className="text-lg font-bold inline ml-2"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Inflation (HICP)
        </h2>
        {isFallback && (
          <span
            className="ml-3 text-xs px-2 py-0.5 rounded"
            style={{ color: 'var(--muted)', background: 'var(--surface2)', fontFamily: "'DM Mono', monospace" }}
          >
            Static fallback · as of Feb 2026
          </span>
        )}
      </div>

      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <DataCard
          title="EA HICP Headline"
          value={headlineLatest?.value}
          pctChange={headlineMoM}
          decimals={1}
          unit="%"
          subLabel={`Eurozone headline inflation · ${headlineLatest?.monthStr || '—'}`}
          loading={headline?.loading}
          error={headline?.error && !headline?.isFallback}
          inverse={false}
          note="Source: Eurostat · Monthly rate of change"
        />
        <DataCard
          title="EA HICP Food"
          value={foodLatest?.value}
          pctChange={foodMoM}
          decimals={1}
          unit="%"
          subLabel={`Eurozone food inflation · ${foodLatest?.monthStr || '—'}`}
          loading={food?.loading}
          error={food?.error && !food?.isFallback}
          inverse={false}
          note="Source: Eurostat · COICOP CP01"
        />
      </div>

      {/* Dual-line HICP chart */}
      {combined?.length > 0 && (
        <div className="card" style={{ padding: '16px 16px 8px' }}>
          <p
            className="text-xs mb-1"
            style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}
          >
            13-Month HICP Trend — Headline vs Food (% MoM)
          </p>
          <div className="flex gap-4 mb-3">
            <LegendDot color="var(--inflation)" label="Headline" />
            <LegendDot color="var(--food)" label="Food" />
            <LegendDot color="#6b7fa3" label="ECB Target 2.0%" dashed />
          </div>
          <LineChartWrapper
            data={combined}
            lines={[
              { key: 'headline', color: 'var(--inflation)', label: 'Headline' },
              { key: 'food', color: 'var(--food)', label: 'Food' },
            ]}
            xKey="month"
            yUnit="%"
            height={220}
            referenceLines={[
              { value: 2.0, label: 'ECB 2%', color: '#6b7fa3' },
            ]}
            showLegend={false}
          />
        </div>
      )}
    </section>
  )
}

function LegendDot({ color, label, dashed }) {
  return (
    <div className="flex items-center gap-1.5">
      {dashed ? (
        <div style={{ width: 16, height: 2, borderTop: `2px dashed ${color}` }} />
      ) : (
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      )}
      <span className="text-xs" style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>
        {label}
      </span>
    </div>
  )
}
