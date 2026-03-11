import { useMemo } from 'react'
import LineChartWrapper from '../LineChart'

const EXPLAINER =
  'Annual food price inflation for the EU, UK, and US. ' +
  'Values show year-over-year percentage change (YoY %) in food consumer prices compared with the same month one year earlier. ' +
  'Sources: Eurostat (EU HICP food), ONS (UK CPI food), and BLS (US CPI-U food at home). ' +
  'Data is refreshed daily when available, while underlying statistical releases remain monthly.'

export default function Inflation({ eu, uk, us }) {
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
    return [...byMonth.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, v]) => v)
  }, [eu.data, uk.data, us.data])

  const allLoading = eu.loading && uk.loading && us.loading
  const anyData = eu.data.length > 0 || uk.data.length > 0 || us.data.length > 0

  const euLatest = eu.data.length > 0 ? eu.data[eu.data.length - 1] : null
  const ukLatest = uk.data.length > 0 ? uk.data[uk.data.length - 1] : null
  const usLatest = us.data.length > 0 ? us.data[us.data.length - 1] : null

  return (
    <section id="inflation" className="mb-14">
      <div className="mb-2">
        <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>
          07 —
        </span>
        <h2 className="inline ml-2" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
          Food Inflation — EU · UK · US (YoY)
        </h2>
      </div>
      <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 20, lineHeight: 1.6 }}>
        {EXPLAINER}
      </p>

      {/* Summary cards */}
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <InflationCard
          label="EU — Eurostat HICP Food (CP01)"
          geography="Euro area, monthly"
          source="Eurostat"
          latest={euLatest}
          unit="%"
          loading={eu.loading}
          error={eu.error}
          color="var(--inflation)"
        />
        <InflationCard
          label="UK — ONS CPI Food (D7BU)"
          geography="United Kingdom, monthly"
          source="ONS"
          latest={ukLatest}
          unit="%"
          loading={uk.loading}
          error={uk.error}
          color="var(--gas)"
        />
        <InflationCard
          label="US — BLS CPI Food at Home"
          geography="United States, monthly"
          source="BLS"
          latest={usLatest}
          unit="%"
          loading={us.loading}
          error={us.error}
          color="#5C69A0"
        />
      </div>

      {/* Chart */}
      <div className="card" style={{ padding: '16px 16px 8px' }}>
        {allLoading ? (
          <div className="flex items-center justify-center" style={{ height: 220, color: 'var(--muted)', fontSize: 14 }}>
            Loading inflation data…
          </div>
        ) : !anyData ? (
          <div className="flex items-center justify-center" style={{ height: 220, color: 'var(--muted)', fontSize: 14 }}>
            No inflation data available
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>
              All series: food price inflation (YoY %) — EU (Eurostat), UK (ONS), US (BLS)
            </p>
            <LineChartWrapper
              data={chartData}
              xKey="month"
              height={220}
              showLegend
              lines={[
                ...(eu.data.length > 0 ? [{ key: 'eu', color: 'var(--inflation)', label: 'EU HICP Food YoY%' }] : []),
                ...(uk.data.length > 0 ? [{ key: 'uk', color: 'var(--gas)',       label: 'UK CPI Food YoY%'  }] : []),
                ...(us.data.length > 0 ? [{ key: 'us', color: '#5C69A0',          label: 'US CPI Food YoY%'  }] : []),
              ]}
            />
          </>
        )}
      </div>

      <div
        className="mt-4 px-4 py-3 rounded-xl"
        style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderLeft: '3px solid var(--inflation)', fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}
      >
        <strong>Why tracked:</strong>{' '}
        Food inflation reflects how commodity, energy, fertilizer, and transport costs pass through to consumer prices.
      </div>
    </section>
  )
}

function InflationCard({ label, geography, source, latest, unit, loading, error, color }) {
  return (
    <div className="card" style={{ borderTop: `3px solid ${color}`, padding: '16px' }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2, lineHeight: 1.4 }}>
        {label}
      </p>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
        {geography}
      </p>
      {loading ? (
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>Loading…</p>
      ) : error ? (
        <p style={{ fontSize: 14, color: 'var(--negative)' }}>Unavailable</p>
      ) : latest ? (
        <>
          <p className="font-bold" style={{ fontSize: 24, color: 'var(--text)' }}>
            {latest.value}{unit}
          </p>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginTop: 2, letterSpacing: '0.04em' }}>
            YoY
          </p>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            {latest.label} · {source}
          </p>
        </>
      ) : (
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>No data</p>
      )}
    </div>
  )
}
