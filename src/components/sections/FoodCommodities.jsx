import { useMemo } from 'react'
import CommodityNarrative from '../CommodityNarrative'
import CompactCard from '../CompactCard'
import { CONFIG_BY_SYMBOL } from '../../utils/commodityConfig'

const SYMBOLS = ['ZW-FUT', 'CORN', 'SOYBEAN-FUT', 'PO', 'BUTTER']

const EXPLAINER =
  'Key agricultural and dairy commodity prices from CommodityPriceAPI. ' +
  'Card values are latest daily closes; charts show 90-day daily closes. ' +
  'Percentage changes are measured over the full 30-day window.'

export default function FoodCommodities({ data, isOverview = false }) {
  const insight = useMemo(() => {
    const upCount = SYMBOLS.filter((sym) => (data[sym]?.pctChange ?? 0) > 10).length
    if (upCount === 0) return 'All food commodity moves are below 10% over the past 30 days.'
    return `${upCount} of ${SYMBOLS.length} food commodities up more than 10% over the past 30 days.`
  }, [data])

  return (
    <section id="food" className="mb-14">
      <div className="mb-2">
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
          Food
        </h2>
      </div>
      {!isOverview && (
        <>
          <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 6, lineHeight: 1.6 }}>
            {EXPLAINER}
          </p>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
            Prices in native contract units — see each card for details.
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
        <>
          {SYMBOLS.map((sym) => (
            <CommodityNarrative key={sym} symbol={sym} data={data} config={CONFIG_BY_SYMBOL[sym]} />
          ))}
          <div
            className="mt-4 px-4 py-3 rounded-xl"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}
          >
            {insight}
          </div>
        </>
      )}
    </section>
  )
}
