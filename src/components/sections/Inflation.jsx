import { useMemo } from 'react'
import LineChartWrapper from '../LineChart'

const EXPLAINER =
  'Food inflation across three major economies. All three series show the monthly rate of change (MoM %) — how much food prices moved vs the prior month.'

export default function Inflation({ eu, uk, us }) {
  // Merge all three series by month key for the chart
  const chartData = useMemo(() => {
    const byMonth = new Map()

    eu.data.forEach((d) => {
      if (!byMonth.has(d.month)) byMonth.set(d.month, { month: d.label })
      byMonth.get(d.month).eu = d.value
    })
    uk.data.forEach((d) => {
      if (!byMonth.has(d.month)) byMonth.set(d.month, { month: d.label })
      byMonth.get(d.month).uk = d.value
    })
    us.data.forEach((d) => {
      if (!byMonth.has(d.month)) byMonth.set(d.month, { month: d.label })
      byMonth.get(d.month).us = d.value
    })

    // Sort by key (YYYY-MM) and return
    return [...byMonth.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, v]) => v)
  }, [eu.data, uk.data, us.data])

  const allLoading = eu.loading && uk.loading && us.loading
  const anyData = eu.data.length > 0 || uk.data.length > 0 || us.data.length > 0

  // Latest values for summary cards
  const euLatest = eu.data.length > 0 ? eu.data[eu.data.length - 1] : null
  const ukLatest = uk.data.length > 0 ? uk.data[uk.data.length - 1] : null
  const usLatest = us.data.length > 0 ? us.data[us.data.length - 1] : null

  return (
    <section id="inflation" className="mb-14">
      <div className="mb-2">
        <span
          className="text-xs uppercase tracking-widest"
          style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}
        >
          07 —
        </span>
        <h2
          className="text-lg font-bold inline ml-2"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Food Inflation
        </h2>
      </div>
      <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400, marginBottom: 20 }}>
        {EXPLAINER}
      </p>

      {/* Summary cards */}
      <div
        className="grid gap-4 mb-6"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
      >
        <InflationCard
          label="EU HICP Food (MoM %)"
          source="Eurostat"
          latest={euLatest}
          unit="%"
          loading={eu.loading}
          error={eu.error}
          color="var(--inflation)"
        />
        <InflationCard
          label="UK CPI Food (MoM %)"
          source="ONS"
          latest={ukLatest}
          unit="%"
          loading={uk.loading}
          error={uk.error}
          color="#3448BF"
        />
        <InflationCard
          label="US CPI Food (MoM %)"
          source="BLS"
          latest={usLatest}
          unit="%"
          loading={us.loading}
          error={us.error}
          color="#8890B5"
        />
      </div>

      {/* Chart */}
      <div className="card" style={{ padding: '16px 16px 8px' }}>
        {allLoading ? (
          <div
            className="flex items-center justify-center"
            style={{ height: 220, color: 'var(--muted)', fontSize: 12 }}
          >
            Loading inflation data…
          </div>
        ) : !anyData ? (
          <div
            className="flex items-center justify-center"
            style={{ height: 220, color: 'var(--muted)', fontSize: 12 }}
          >
            No inflation data available
          </div>
        ) : (
          <>
            <p
              style={{
                color: 'var(--muted)',
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                opacity: 0.7,
                marginBottom: 8,
              }}
            >
              All series: monthly rate of change (MoM %)
            </p>
            <LineChartWrapper
              data={chartData}
              xKey="month"
              height={220}
              showLegend
              lines={[
                ...(eu.data.length > 0
                  ? [{ key: 'eu', color: 'var(--inflation)', label: 'EU HICP Food (MoM %)' }]
                  : []),
                ...(uk.data.length > 0
                  ? [{ key: 'uk', color: '#3448BF', label: 'UK CPI Food (MoM %)' }]
                  : []),
                ...(us.data.length > 0
                  ? [{ key: 'us', color: '#8890B5', label: 'US CPI Food (MoM %)' }]
                  : []),
              ]}
            />
          </>
        )}
      </div>

      {/* Why tracked */}
      <div
        className="mt-4 px-4 py-3 rounded-xl text-xs"
        style={{
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderLeft: '3px solid var(--inflation)',
          color: 'var(--muted)',
          fontFamily: "'DM Mono', monospace",
          fontSize: 12,
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: 'var(--text)' }}>Why tracked:</strong>{' '}
        Food inflation is the downstream impact of commodity price shocks on consumers.
        All three series measure the monthly rate of change in food prices (MoM %) — EU HICP via Eurostat, UK CPI via ONS, and US CPI Food via BLS.
      </div>
    </section>
  )
}

function InflationCard({ label, source, latest, unit, loading, error, color }) {
  return (
    <div
      className="card px-4 py-3"
      style={{ borderTop: `2px solid ${color}` }}
    >
      <p
        className="text-xs mb-1"
        style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10 }}
      >
        {label}
      </p>
      {loading ? (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading…</p>
      ) : error ? (
        <p className="text-sm" style={{ color: '#D94F3D' }}>Unavailable</p>
      ) : latest ? (
        <>
          <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>
            {latest.value}{unit}
          </p>
          <p className="text-xs" style={{ color: 'var(--muted)', fontSize: 10 }}>
            {latest.label} · {source}
          </p>
        </>
      ) : (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>No data</p>
      )}
    </div>
  )
}
