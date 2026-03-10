import DataCard from '../DataCard'
import LineChartWrapper from '../LineChart'
import { formatMonth } from '../../utils/formatters'

const EXPLAINER =
  "HICP (Harmonised Index of Consumer Prices) is the EU's official inflation measure. The ECB targets 2%. " +
  'Food HICP tracks grocery and food service prices separately — it typically reacts to energy and fertilizer shocks with a 3–6 month lag. ' +
  'US, UK and China food CPI are shown for cross-regional comparison.'

export default function Inflation({ headline, food, combined, isFallback, oecdData }) {
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
  const foodMoM     = getMoMChange(food?.data, foodLatest)

  const headlineAsOf = headlineLatest?.monthStr ? formatMonth(headlineLatest.monthStr) + ' (latest)' : null
  const foodAsOf     = foodLatest?.monthStr     ? formatMonth(foodLatest.monthStr)     + ' (latest)' : null

  const chartStart = combined?.[0]?.month
  const chartEnd   = combined?.slice(-1)[0]?.month

  // Merge OECD data into combined chart — align by month label
  const enriched = (combined ?? []).map(row => {
    const usRow  = oecdData?.usa?.find(d => d.month === row.month)
    const gbrRow = oecdData?.gbr?.find(d => d.month === row.month)
    const chnRow = oecdData?.chn?.find(d => d.month === row.month)
    return {
      ...row,
      us_food:  usRow?.value  ?? null,
      uk_food:  gbrRow?.value ?? null,
      chn_food: chnRow?.value ?? null,
    }
  })

  const hasOECD = (oecdData?.usa?.length ?? 0) > 0

  return (
    <section id="inflation" className="mb-14">
      <div className="mb-2">
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
          Inflation
        </h2>

      </div>
      <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400, marginBottom: 20 }}>
        {EXPLAINER}
      </p>

      {/* EU HICP cards + OECD summary cards */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
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
          subLabel="Eurozone food inflation · CP01"
          loading={food?.loading}
          error={food?.error && !food?.isFallback}
          inverse={false}
          note="Source: Eurostat · Monthly rate of change"
          asOf={foodAsOf}
          isFallback={food?.isFallback}
        />
        {hasOECD && (() => {
          const oecdRows = [
            { key: 'usa', label: 'US CPI Food',     sub: 'US food CPI · MoM · OECD',    arr: oecdData.usa },
            { key: 'gbr', label: 'UK CPI Food',     sub: 'UK food CPI · MoM · OECD',    arr: oecdData.gbr },
            { key: 'chn', label: 'China CPI Food',  sub: 'China food CPI · MoM · OECD', arr: oecdData.chn },
          ]
          return oecdRows.map(({ key, label, sub, arr }) => {
            const latest = arr?.[arr.length - 1]
            const prev   = arr?.[arr.length - 2]
            const mom    = (latest && prev) ? latest.value - prev.value : null
            return (
              <DataCard
                key={key}
                title={label}
                value={latest?.value}
                pctChange={mom}
                decimals={2}
                unit="%"
                subLabel={sub}
                loading={oecdData?.loading}
                error={false}
                inverse={false}
                asOf={latest?.month}
                isFallback={oecdData?.isFallback}
              />
            )
          })
        })()}
      </div>

      {/* Combined multi-region chart */}
      {enriched.length > 0 && (
        <div className="card" style={{ padding: '16px 16px 8px' }}>
          <p
            className="text-xs mb-1"
            style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}
          >
            Food Inflation — EU · US · UK · China (% MoM)
          </p>
          {chartStart && chartEnd && (
            <p style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, opacity: 0.7, marginBottom: 8 }}>
              Period: {chartStart} – {chartEnd}
            </p>
          )}
          <div className="flex gap-4 mb-3 flex-wrap">
            <LegendDot color="var(--inflation)"  label="EA Headline" />
            <LegendDot color="var(--food)"       label="EA Food" />
            {hasOECD && <>
              <LegendDot color="var(--oil)"      label="US Food"    dashed />
              <LegendDot color="var(--shipping)" label="UK Food"    dashed />
              <LegendDot color="var(--gas)"      label="China Food" dashed />
            </>}
            <LegendDot color="#6b7fa3" label="ECB 2%" dashed />
          </div>
          <LineChartWrapper
            data={enriched}
            lines={[
              { key: 'headline',  color: 'var(--inflation)',  label: 'EA Headline' },
              { key: 'food',      color: 'var(--food)',       label: 'EA Food' },
              ...(hasOECD ? [
                { key: 'us_food',  color: 'var(--oil)',      label: 'US Food',    dashed: true },
                { key: 'uk_food',  color: 'var(--shipping)', label: 'UK Food',    dashed: true },
                { key: 'chn_food', color: 'var(--gas)',      label: 'China Food', dashed: true },
              ] : []),
            ]}
            xKey="month"
            yUnit="%"
            height={180}
            referenceLines={[
              { value: 2.0, label: 'ECB 2%',    color: '#6b7fa3' },
              { value: 0.0, label: 'Deflation', color: '#4ade8060' },
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
