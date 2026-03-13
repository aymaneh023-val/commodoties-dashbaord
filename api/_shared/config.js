/**
 * Server-side commodity config — single source of truth.
 *
 * This is the canonical config used by all serverless functions (backfill,
 * daily-refresh, timeseries, cron). The frontend has its own mirror at
 * src/utils/commodityConfig.js — they MUST stay in sync.
 *
 * Adding a symbol = adding one entry here + one in src/utils/commodityConfig.js.
 */

export const COMMODITY_CONFIG = [
  // ── Energy
  { symbol: 'BRENTOIL-FUT', source: 'commoditypriceapi', layer: 'energy' },
  { symbol: 'TTF-GAS',      source: 'commoditypriceapi', layer: 'energy' },
  { symbol: 'LGO',          source: 'commoditypriceapi', layer: 'energy' },
  // ── Fertilizer
  { symbol: 'UREA',         source: 'commoditypriceapi', layer: 'fertilizer' },
  { symbol: 'DIAPH',        source: 'commoditypriceapi', layer: 'fertilizer' },
  // ── Metals
  { symbol: 'XAU',          source: 'commoditypriceapi', layer: 'metals' },
  { symbol: 'AL-FUT',       source: 'commoditypriceapi', layer: 'metals' },
  // ── Agriculture
  { symbol: 'ZW-FUT',       source: 'commoditypriceapi', layer: 'agriculture' },
  { symbol: 'CORN',         source: 'commoditypriceapi', layer: 'agriculture' },
  { symbol: 'SOYBEAN-FUT',  source: 'commoditypriceapi', layer: 'agriculture' },
  { symbol: 'PO',           source: 'commoditypriceapi', layer: 'agriculture' },
  // ── Dairy
  { symbol: 'BUTTER',       source: 'commoditypriceapi', layer: 'dairy' },
  // ── Shipping (Yahoo Finance)
  { symbol: 'BDRY',         source: 'yahoo', layer: 'shipping' },
  { symbol: 'MAERSK-B.CO',  source: 'yahoo', layer: 'shipping' },
  { symbol: 'HLAG.DE',      source: 'yahoo', layer: 'shipping' },
  { symbol: '1919.HK',      source: 'yahoo', layer: 'shipping' },
  // ── Synthetic
  {
    symbol: 'CONTAINER-INDEX',
    source: 'synthetic',
    layer: 'shipping',
    synthetic: { components: ['MAERSK-B.CO', 'HLAG.DE', '1919.HK'], baseValue: 100 },
  },
]

// Derived helpers
export const CPA_SYMBOLS = COMMODITY_CONFIG.filter((c) => c.source === 'commoditypriceapi').map((c) => c.symbol)
export const YAHOO_SYMBOLS = COMMODITY_CONFIG.filter((c) => c.source === 'yahoo').map((c) => c.symbol)
export const SYNTHETIC_ENTRIES = COMMODITY_CONFIG.filter((c) => c.source === 'synthetic')
export const ALL_SYMBOLS = COMMODITY_CONFIG.map((c) => c.symbol)

/** Batch an array into chunks of `size` */
export function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

/** Max symbols per CommodityPriceAPI request (trial=5, Plus=10, Premium=20) */
export const CPA_BATCH_SIZE = parseInt(process.env.CPA_BATCH_SIZE || '5', 10)
