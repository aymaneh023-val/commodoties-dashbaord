import DataCard from '../DataCard'
import LineChartWrapper from '../LineChart'

const EXPLAINER =
  'TTF — Title Transfer Facility — is Europe\'s primary natural gas pricing benchmark. ' +
  'Front-month futures (TTF=F) trade on ICE Endex, Netherlands. Card value is latest quote (regular market price); chart shows 30-day daily closes. Prices in EUR per MWh (€/MWh). ' +
  'TTF sets the marginal cost of industrial energy and drives nitrogen fertilizer production costs across Europe.'

export default function GasLNG({ ttf }) {
  const ttfHistory = ttf?.history ?? []

  return (
    <section id="gas" className="mb-14">
      <div className="mb-2">
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
          European Natural Gas (TTF)
        </h2>
      </div>
      <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 6, lineHeight: 1.6 }}>
        {EXPLAINER}
      </p>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
        €/MWh = euros per megawatt-hour of energy
      </p>

      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <DataCard
          title="TTF Natural Gas — ICE Endex"
          value={ttf?.price}
          pctChange={ttf?.pctChange}
          decimals={2}
          unit=" €/MWh"
          subLabel="Front-month futures (TTF=F) · EUR per MWh · latest quote"
          loading={ttf?.loading}
          error={ttf?.error}
          inverse={false}
          asOf={ttf?.asOf}
          fromCache={ttf?.fromCache}
          cacheAge={ttf?.cacheAge}
          baseDate={ttf?.baseDate}
          isFallback={ttf?.error && ttf?.price != null}
        />
      </div>

      {ttfHistory.length > 0 && (
        <div className="card mb-4" style={{ padding: '16px 16px 8px' }}>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>
            TTF Natural Gas (TTF=F) · 30 days · EUR/MWh
          </p>
          <LineChartWrapper
            data={ttfHistory}
            lines={[{ key: 'close', color: 'var(--gas)', label: 'TTF €/MWh' }]}
            xKey="date"
            yUnit=" €/MWh"
            height={160}
          />
        </div>
      )}

      <div className="card" style={{ background: 'var(--surface2)', borderLeft: '3px solid var(--gas)' }}>
        <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 10 }}>
          Why tracked
        </p>
        <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>
          TTF is the main benchmark for natural gas pricing in Europe and affects industrial energy costs.
        </p>
      </div>
    </section>
  )
}
