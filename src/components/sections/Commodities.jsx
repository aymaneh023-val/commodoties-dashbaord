import CommodityNarrative from '../CommodityNarrative'
import CompactCard from '../CompactCard'
import { CONFIG_BY_SYMBOL } from '../../utils/commodityConfig'

const SYMBOLS = ['BRENTOIL-FUT', 'TTF-GAS', 'LGO', 'XAU', 'AL-FUT']

const EXPLAINER =
  'Energy and metals benchmarks with direct impact on European food supply chain costs. ' +
  'Charts show 90-day daily closes; percentage changes measured over a 30-day rolling window.'

export default function Commodities({ data, isOverview = false }) {
  return (
    <section id="commodities" className="mb-14">
      <div className="mb-2">
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
          Commodities
        </h2>
      </div>
      {!isOverview && (
        <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 20, lineHeight: 1.6 }}>
          {EXPLAINER}
        </p>
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
