import { useMemo } from 'react'
import LineChartWrapper from '../LineChart'
import INFLATION_COUNTRIES from '../../utils/inflationConfig'

const BARO_META = {
  AUS:   { name: 'Australia',      color: '#22C55E' },
  GBR:   { name: 'United Kingdom', color: 'var(--gas)' },
  USA:   { name: 'United States',  color: '#5C69A0' },
  BRA:   { name: 'Brazil',         color: '#F59E0B' },
  CHN:   { name: 'China',          color: '#E63946' },
  IND:   { name: 'India',          color: '#F97316' },
  ZAF:   { name: 'South Africa',   color: '#14B8A6' },
  OECDE: { name: 'OECD Europe',    color: '#8B5CF6' },
}

const EXPLAINER =
  'Food price inflation across 9 major economies — the end-of-chain signal that shows how commodity, energy, and logistics cost increases are landing in consumer pricing. ' +
  'Year-over-year percentage change (YoY %) in food consumer prices. Countries marked with * use headline CPI where food-specific data is unavailable.'

export default function Inflation({ countries, loading, error, barometer }) {
  // CPI chart data
  const chartData = useMemo(() => {
    const byMonth = new Map()
    for (const cfg of INFLATION_COUNTRIES) {
      const series = countries[cfg.code]
      if (!series?.data?.length) continue
      for (const d of series.data) {
        if (!byMonth.has(d.month)) byMonth.set(d.month, { month: d.label })
        byMonth.get(d.month)[cfg.code] = d.value
      }
    }
    return [...byMonth.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, v]) => v)
  }, [countries])

  const anyData = Object.values(countries).some((c) => c.data?.length > 0)

  const lines = INFLATION_COUNTRIES
    .filter((cfg) => countries[cfg.code]?.data?.length > 0)
    .map((cfg) => {
      const fallback = countries[cfg.code]?.isHeadlineFallback
      return {
        key: cfg.code,
        color: cfg.color,
        label: `${cfg.name}${fallback ? ' *' : ''}`,
      }
    })

  const cards = INFLATION_COUNTRIES
    .filter((cfg) => countries[cfg.code]?.data?.length > 0)
    .map((cfg) => {
      const series = countries[cfg.code]
      const latest = series.data[series.data.length - 1]
      return { cfg, latest, isHeadlineFallback: series.isHeadlineFallback }
    })

  // Barometer chart data
  const baroData = barometer?.countries ?? {}
  const baroChartData = useMemo(() => {
    const byMonth = new Map()
    for (const [code, series] of Object.entries(baroData)) {
      if (!series?.data?.length) continue
      for (const d of series.data) {
        if (!byMonth.has(d.month)) byMonth.set(d.month, { month: d.label })
        byMonth.get(d.month)[code] = d.value
      }
    }
    return [...byMonth.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, v]) => v)
  }, [baroData])

  const baroLines = Object.keys(baroData)
    .filter((code) => baroData[code]?.data?.length > 0 && BARO_META[code])
    .map((code) => ({
      key: code,
      color: BARO_META[code].color,
      label: BARO_META[code].name,
    }))

  const anyBaroData = baroLines.length > 0

  return (
    <section id="macro" className="mb-14">
      <div className="mb-2">
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
          Macro Developments — Global CPI Comparison (YoY)
        </h2>
      </div>
      <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 20, lineHeight: 1.6 }}>
        {EXPLAINER}
      </p>

      {/* Summary cards */}
      <div
        className="grid gap-4 mb-6"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
      >
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--muted)', fontSize: 14, padding: 24 }}>
            Loading inflation data…
          </div>
        ) : error ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--negative)', fontSize: 14, padding: 24 }}>
            Inflation data unavailable
          </div>
        ) : (
          cards.map(({ cfg, latest, isHeadlineFallback }) => (
            <InflationCard
              key={cfg.code}
              label={`${cfg.name}${isHeadlineFallback ? ' *' : ''}`}
              source={isHeadlineFallback ? 'OECD (headline)' : 'OECD (food CP01)'}
              latest={latest}
              color={cfg.color}
            />
          ))
        )}
      </div>

      {/* CPI chart */}
      <div className="card" style={{ padding: '16px 16px 8px' }}>
        {loading ? (
          <div className="flex items-center justify-center" style={{ height: 280, color: 'var(--muted)', fontSize: 14 }}>
            Loading inflation data…
          </div>
        ) : !anyData ? (
          <div className="flex items-center justify-center" style={{ height: 280, color: 'var(--muted)', fontSize: 14 }}>
            No inflation data available
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>
              Food price inflation (YoY %) across 9 economies. * = headline CPI fallback.
            </p>
            <LineChartWrapper
              data={chartData}
              xKey="month"
              height={280}
              showLegend
              lines={lines}
            />
          </>
        )}
      </div>

      <div
        className="mt-4 px-4 py-3 rounded-xl"
        style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderLeft: '3px solid var(--inflation)', fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}
      >
        <strong>Why tracked:</strong>{' '}
        CPI is the end-of-chain measure of how upstream cost movements — energy, freight, fertilizer, raw materials — pass through into shelf pricing. For food companies, it signals whether cost increases are being absorbed or passed on, and how pricing power varies across markets.
      </div>

      {/* Consumer Barometer */}
      <div className="mt-10">
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
          Consumer Confidence Barometer
        </h3>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.6 }}>
          Consumer confidence directly affects pricing power. When sentiment is negative, consumers trade down and resist price increases — limiting how much cost inflation food companies can pass through. When confidence recovers, pricing elasticity improves. Above zero = positive sentiment; below zero = negative.
        </p>
        <div className="card" style={{ padding: '16px 16px 8px' }}>
          {barometer?.loading ? (
            <div className="flex items-center justify-center" style={{ height: 260, color: 'var(--muted)', fontSize: 14 }}>
              Loading barometer data…
            </div>
          ) : barometer?.error ? (
            <div className="flex items-center justify-center" style={{ height: 260, color: 'var(--muted)', fontSize: 14 }}>
              Barometer data unavailable
            </div>
          ) : !anyBaroData ? (
            <div className="flex items-center justify-center" style={{ height: 260, color: 'var(--muted)', fontSize: 14 }}>
              No barometer data available
            </div>
          ) : (
            <LineChartWrapper
              data={baroChartData}
              xKey="month"
              height={260}
              showLegend
              lines={baroLines}
            />
          )}
        </div>
      </div>
    </section>
  )
}

function InflationCard({ label, source, latest, color }) {
  return (
    <div className="card" style={{ borderTop: `3px solid ${color}`, padding: '16px' }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2, lineHeight: 1.4 }}>
        {label}
      </p>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
        {source}
      </p>
      {latest ? (
        <>
          <p className="font-bold" style={{ fontSize: 24, color: 'var(--text)' }}>
            {latest.value}%
          </p>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginTop: 2, letterSpacing: '0.04em' }}>
            YoY
          </p>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            {latest.label}
          </p>
        </>
      ) : (
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>No data</p>
      )}
    </div>
  )
}

