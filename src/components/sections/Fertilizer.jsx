import CommodityNarrative from '../CommodityNarrative'
import CompactCard from '../CompactCard'
import { CONFIG_BY_SYMBOL } from '../../utils/commodityConfig'

const SYMBOLS = ['UREA', 'DIAPH']

const EXPLAINER =
  'Urea and Diammonium Phosphate (DAP) — the two most widely traded fertilizers. ' +
  'Natural gas accounts for 70–80% of urea production cost, creating a direct link between gas prices and farm-level input costs. ' +
  'Charts show 90-day daily closes; prices in USD per metric ton.'

export default function Fertilizer({ data, isOverview = false }) {
  return (
    <section id="fertilizers" className="mb-14">
      <div className="mb-2">
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
          Fertilizer
        </h2>
      </div>
      {!isOverview && (
        <>
          <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 6, lineHeight: 1.6 }}>
            {EXPLAINER}
          </p>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
            $/ton = US dollars per metric ton (1,000 kg)
          </p>
        </>
      )}

      {isOverview ? (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
          {SYMBOLS.map((sym) => (
            <CompactCard key={sym} symbol={sym} data={data} config={CONFIG_BY_SYMBOL[sym]} />
          ))}
        </div>
      ) : (
        SYMBOLS.map((sym) => (
          <CommodityNarrative key={sym} symbol={sym} data={data} config={CONFIG_BY_SYMBOL[sym]} />
        ))
      )}
    </section>
  )
}
