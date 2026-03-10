import DataCard from '../DataCard'
import LineChartWrapper from '../LineChart'
import { formatPrice, pctColor, pctArrow, formatPct } from '../../utils/formatters'

const EXPLAINER =
  'Urea is the world\'s most traded nitrogen fertilizer. Its price is 70–80% driven by natural gas costs. ' +
  'A urea spike follows gas price moves by ~4–6 weeks and directly raises farming input costs across Europe and Asia.'

const WHY_IT_MATTERS = [
  'Natural gas accounts for 70–80% of nitrogen fertilizer production cost — a gas spike flows directly into urea prices.',
  'IMF PFERT aggregates urea, DAP, TSP and potash — the institutional benchmark used by the World Bank and FAO.',
  'Rising fertilizer costs raise agricultural input costs, then food prices, then EU food HICP with a 3–6 month lag.',
]

export default function Fertilizer({ urea, pfert }) {
  const ureaHistory = urea?.history ?? []
  const lastDate = ureaHistory.slice(-1)[0]?.date ?? null

  const pfertLatest = pfert?.latest
  const pfertPct    = pfert?.pctChange
  const pfertColor  = pctColor(pfertPct)
  const pfertArrow  = pctArrow(pfertPct)

  return (
    <section id="fertilizer" className="mb-14">
      <div className="mb-2">
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
      <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400, marginBottom: 20 }}>
        {EXPLAINER}
      </p>

      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <DataCard
          title="Urea Futures (UFB=F)"
          value={urea?.price}
          pctChange={urea?.pctChange}
          decimals={2}
          unit=" $/ton"
          subLabel="CBOT Urea futures · nitrogen benchmark"
          loading={urea?.loading}
          error={urea?.error}
          inverse={false}
          asOf={lastDate}
          fromCache={urea?.fromCache}
          cacheAge={urea?.cacheAge}
          baseDate={urea?.baseDate}
          isFallback={urea?.error && urea?.price != null}
        />

        {/* IMF PFERT index card */}
        <div className="card relative overflow-hidden">
          <p
            className="text-xs uppercase tracking-widest mb-3"
            style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}
          >
            IMF Fertilizer Index
          </p>

          {pfert?.loading ? (
            <div>
              <div className="skeleton" style={{ width: 80, height: 32, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: 120, height: 10 }} />
            </div>
          ) : (
            <>
              <div className="flex items-end gap-3 flex-wrap">
                <span
                  className="text-3xl font-bold leading-none"
                  style={{ fontFamily: "'Syne', sans-serif", color: 'var(--text)' }}
                >
                  {pfertLatest ? formatPrice(pfertLatest.value, 1) : '—'}
                </span>
                {pfertPct != null && (
                  <span
                    className="text-sm font-medium px-2 py-0.5 rounded-md"
                    style={{ color: pfertColor, background: `${pfertColor}18`, fontFamily: "'DM Mono', monospace" }}
                  >
                    {pfertArrow} {formatPct(pfertPct)}
                  </span>
                )}
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                Index (2016=100) · monthly
              </p>
              {pfertLatest?.month && (
                <p style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: 'var(--muted)', marginTop: 2, opacity: 0.7 }}>
                  as of {pfertLatest.month}
                </p>
              )}
              {!pfert?.loading && pfert?.data?.length === 0 && (
                <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginTop: 4 }}>
                  Data currently unavailable
                </p>
              )}
            </>
          )}

          <p className="text-xs mt-3 pt-3 leading-relaxed" style={{ color: 'var(--muted)', borderTop: '1px solid var(--border)' }}>
            IMF PFERT aggregates urea, DAP, TSP and potash · Source: IMF
          </p>
        </div>
      </div>

      {/* Urea 30d chart */}
      {ureaHistory.length > 0 && (
        <div className="card mb-4" style={{ padding: '16px 16px 8px' }}>
          <p style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, opacity: 0.7, marginBottom: 8 }}>
            Urea Futures (UFB=F) · 30d · USD/ton
          </p>
          <LineChartWrapper
            data={ureaHistory}
            lines={[{ key: 'close', color: '#4ade80', label: 'Urea' }]}
            xKey="date"
            yUnit=" $/ton"
            height={160}
          />
        </div>
      )}

      {/* IMF PFERT chart */}
      {pfert?.data?.length > 0 && (
        <div className="card mb-4" style={{ padding: '16px 16px 8px' }}>
          <p style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, opacity: 0.7, marginBottom: 8 }}>
            IMF Fertilizer Price Index · 13 months · Index (2016=100)
          </p>
          <LineChartWrapper
            data={pfert.data}
            lines={[{ key: 'value', color: 'rgba(74,222,128,0.5)', label: 'PFERT Index' }]}
            xKey="month"
            yUnit=""
            height={130}
          />
        </div>
      )}

      <div
        className="card"
        style={{ background: 'var(--surface2)', borderLeft: '3px solid var(--fertilizer)' }}
      >
        <p
          className="text-xs uppercase tracking-widest mb-3"
          style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}
        >
          Why this matters for food prices
        </p>
        <ul className="space-y-2">
          {WHY_IT_MATTERS.map((point, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              <span style={{ color: 'var(--fertilizer)', flexShrink: 0 }}>·</span>
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
