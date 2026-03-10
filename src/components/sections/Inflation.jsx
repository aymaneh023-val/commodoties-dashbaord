import DataCard from '../DataCard'
import LineChartWrapper from '../LineChart'
import { formatMonth } from '../../utils/formatters'

export default function Inflation({ headline, food, combined, isFallback }) {
  const headlineLatest = headline?.latest
  const foodLatest = food?.latest

  function getMoMChange(data, latest) {
    if (!data || data.length < 2) return null
    const prev = data[data.length - 2]?.value
    const curr = latest?.value
    if (prev == null || curr == null) return null
    return curr - prev
  }

  const headlineMoM = getMoMChange(headline?.data, headlineLatest)
  const foodMoM = getMoMChange(food?.data, foodLatest)

  // Human-readable reference period (replaces raw "2025-13" style keys)
  const headlineAsOf = headlineLatest?.monthStr ? formatMonth(headlineLatest.monthStr) + ' (latest available)' : null
  const foodAsOf = foodLatest?.monthStr ? formatMonth(foodLatest.monthStr) + ' (latest available)' : null

  const chartStart = combined?.[0]?.month
  const chartEnd = combined?.slice(-1)[0]?.month

  return (
    <section id="inflation" className="mb-14">
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
            style={{ color: '#f59e0b', background: '#f59e0b18', border: '1px solid #f59e0b40', fontFamily: "'DM Mono', monospace" }}
          >
            ⚠ Static fallback · as of Feb 2026
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
          subLabel="Eurozone headline inflation · MoM"
          loading={headline?.loading}
          error={headline?.error && !headline?.isFallback}
          inverse={false}
          note="Source: Eurostat · Monthly rate of change"
          asOf={headlineAsOf}
          isFallback={headline?.isFallback}
        />
        <DataCard
          title="EA HICP Food"
          value={foodLatest?.value}
          pctChange={foodMoM}
          decimals={1}
          unit="%"
          subLabel="Eurozone food inflation · COICOP CP01"
          loading={food?.loading}
          error={food?.error && !food?.isFallback}
          inverse={false}
          note="Source: Eurostat · Monthly rate of change"
          asOf={foodAsOf}
          isFallback={food?.isFallback}
        />
      </div>

      {combined?.length > 0 && (
        <div className="card" style={{ padding: '16px 16px 8px' }}>
          <p
            className="text-xs mb-1"
            style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}
          >
            13-Month HICP Trend — Headline vs Food (% MoM)
          </p>
          {chartStart && chartEnd && (
            <p
              style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, opacity: 0.7, marginBottom: 8 }}
            >
              Period: {chartStart} – {chartEnd}
            </p>
          )}
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
            referenceLines={[{ value: 2.0, label: 'ECB 2%', color: '#6b7fa3' }]}
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
