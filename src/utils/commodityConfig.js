/**
 * COMMODITY_CONFIG — single source of truth for every tracked symbol.
 *
 * Adding a new symbol = adding one entry here. Nothing else needs to change
 * for it to flow through ingestion (backfill / daily-refresh), Supabase
 * storage (commodity_timeseries), and the frontend (hooks + components).
 *
 * Fields:
 *   symbol   – API symbol string (CommodityPriceAPI, Yahoo, or synthetic id)
 *   name     – Human-readable name
 *   layer    – Thematic group: energy | fertilizer | metals | agriculture | dairy | shipping
 *   section  – UI filter tab: commodities | fertilizers | food | shipping
 *   source   – Data provider: 'commoditypriceapi' | 'yahoo' | 'synthetic'
 *   unit     – Display unit string (e.g. ' $/bbl')
 *   currency – ISO currency of the native quote
 *   decimals – Number of decimal places for display
 *   color    – CSS color variable or hex for charts
 *   whyAdded – Short rationale explaining why this commodity is tracked
 */

const COMMODITY_CONFIG = [
  // ── Energy ────────────────────────────────────────────────────────────
  {
    symbol: 'BRENTOIL-FUT',
    name: 'Brent Crude Futures',
    layer: 'energy',
    section: 'commodities',
    source: 'commoditypriceapi',
    unit: ' $/bbl',
    currency: 'USD',
    decimals: 2,
    color: 'var(--oil)',
    whyAdded: 'Global oil benchmark that directly sets European fuel, heating, and petrochemical input costs.',
    contextCopy: 'Crude oil is the upstream driver of energy costs across the entire food supply chain. It directly affects the cost of running processing facilities, powering cold storage, and fueling logistics fleets. For food manufacturers and retailers, sustained Brent price increases show up 4\u20138 weeks later in energy bills, packaging costs, and inbound freight rates.',
  },
  {
    symbol: 'TTF-GAS',
    name: 'TTF Natural Gas',
    layer: 'energy',
    section: 'commodities',
    source: 'commoditypriceapi',
    unit: ' €/MWh',
    currency: 'EUR',
    decimals: 2,
    color: 'var(--gas)',
    whyAdded: "Europe's primary gas pricing benchmark; drives industrial energy and nitrogen fertilizer production costs.",
    contextCopy: 'Natural gas is the primary energy source for food processing, greenhouse heating, and cold chain infrastructure across Europe. For bakeries, dairy processors, and ready meal manufacturers, gas prices are one of the largest controllable cost lines. A 20% move in TTF typically translates directly into margin pressure within one to two billing cycles.',
  },
  {
    symbol: 'LGO',
    name: 'Gas Oil (Diesel Proxy)',
    layer: 'energy',
    section: 'commodities',
    source: 'commoditypriceapi',
    unit: ' $/100T',
    currency: 'USD',
    decimals: 2,
    color: '#E67E22',
    whyAdded: 'ICE diesel proxy; reflects European transport and logistics fuel costs across food supply chains.',
    contextCopy: 'Diesel is the fuel of the food supply chain. Every truck moving produce from farm to distribution centre, every refrigerated vehicle delivering to retail, and most agricultural machinery runs on diesel. Rising Gas Oil prices increase logistics costs for the entire chain \u2014 from growers and packers to retailers and foodservice operators.',
  },

  // ── Metals ────────────────────────────────────────────────────────────
  {
    symbol: 'XAU',
    name: 'Gold',
    layer: 'metals',
    section: 'commodities',
    source: 'commoditypriceapi',
    unit: ' $/oz',
    currency: 'USD',
    decimals: 2,
    color: '#F1C40F',
    whyAdded: 'Safe-haven asset and inflation hedge; signals market risk appetite and inflation expectations.',
    contextCopy: 'Gold is a leading indicator of geopolitical stress and inflation expectations. For supply chain planners, a sustained rise in gold signals that broader commodity and freight cost increases are likely to follow. It doesn\u2019t directly affect food costs, but it is a reliable early warning signal that market conditions are deteriorating.',
  },
  {
    symbol: 'AL-FUT',
    name: 'Aluminium Futures',
    layer: 'metals',
    section: 'commodities',
    source: 'commoditypriceapi',
    unit: ' $/ton',
    currency: 'USD',
    decimals: 2,
    color: '#95A5A6',
    whyAdded: 'Industrial metal used in food packaging and agricultural equipment; cost-push inflation indicator.',
    contextCopy: 'Aluminium is a critical input for food and beverage packaging \u2014 cans, foil, lids, and flexible packaging all depend on it. For food manufacturers, aluminium price movements feed directly into packaging procurement costs. Dairy, beverage, and convenience food producers are most exposed.',
  },

  // ── Fertilizer ────────────────────────────────────────────────────────
  {
    symbol: 'UREA',
    name: 'Urea',
    layer: 'fertilizer',
    section: 'fertilizers',
    source: 'commoditypriceapi',
    unit: ' $/ton',
    currency: 'USD',
    decimals: 2,
    color: 'var(--fertilizer)',
    whyAdded: 'Most widely traded nitrogen fertilizer; production cost is 70–80% natural gas, creating a direct gas-to-food cost link.',
    contextCopy: 'Urea is the most widely used nitrogen fertilizer globally and a direct input cost for grain, vegetable, and fruit growers. Because urea production is 70–80% natural gas, gas price spikes translate quickly into higher fertilizer bills for farmers — which then flow through to ingredient procurement costs for food manufacturers and retailers within one to two growing seasons.',
  },
  {
    symbol: 'DIAPH',
    name: 'Diammonium Phosphate',
    layer: 'fertilizer',
    section: 'fertilizers',
    source: 'commoditypriceapi',
    unit: ' $/ton',
    currency: 'USD',
    decimals: 2,
    color: '#8E44AD',
    whyAdded: 'Key phosphate-based fertilizer; major input cost driver for global crop production.',
    contextCopy: 'DAP is a key phosphate-based fertilizer used across grain, oilseed, and vegetable production. For seed breeders, fruit and vegetable growers, and food manufacturers buying agricultural commodities, DAP price movements are an early indicator of input cost pressure at the farm level — and therefore a leading signal for raw material cost inflation.',
  },

  // ── Agriculture ───────────────────────────────────────────────────────
  {
    symbol: 'ZW-FUT',
    name: 'Wheat Futures',
    layer: 'agriculture',
    section: 'food',
    source: 'commoditypriceapi',
    unit: ' $/oz',
    currency: 'USD',
    decimals: 2,
    color: '#B86E00',
    whyAdded: 'Global wheat benchmark; staple food and feed grain critical for EU food security.',
    contextCopy: 'Wheat is a foundational ingredient across bakery, pasta, breakfast cereals, animal feed, and many processed foods. For bakeries and food manufacturers, wheat futures are one of the most direct cost indicators available. MENA countries are among the world\u2019s largest wheat importers, meaning regional instability creates demand and supply shocks simultaneously.',
  },
  {
    symbol: 'CORN',
    name: 'Corn',
    layer: 'agriculture',
    section: 'food',
    source: 'commoditypriceapi',
    unit: ' ¢/bu',
    currency: 'USC',
    decimals: 2,
    color: '#8A6200',
    whyAdded: 'Key feed grain and biofuel input; affects meat, dairy, and processed food costs.',
    contextCopy: 'Corn is the primary feed grain for poultry, pork, and beef production globally. For dairy companies, meat processors, and food retailers with large fresh and chilled categories, corn price movements are a leading indicator of protein input costs — typically with a 3–6 month lag before they appear in supplier pricing.',
  },
  {
    symbol: 'SOYBEAN-FUT',
    name: 'Soybeans Futures',
    layer: 'agriculture',
    section: 'food',
    source: 'commoditypriceapi',
    unit: ' ¢/bu',
    currency: 'USC',
    decimals: 2,
    color: '#2D7A4F',
    whyAdded: 'Major protein crop and vegetable oil source; linked to animal feed and food manufacturing costs.',
    contextCopy: 'Soybeans are the backbone of animal feed protein globally and a key source of vegetable oil. Rising soybean prices feed through into poultry, pork, dairy, and aquaculture production costs. For food manufacturers using plant-based proteins or vegetable oils, soybeans are also a direct ingredient cost driver.',
  },
  {
    symbol: 'PO',
    name: 'Palm Oil',
    layer: 'agriculture',
    section: 'food',
    source: 'commoditypriceapi',
    unit: ' MYR/ton',
    currency: 'MYR',
    decimals: 2,
    color: '#D35400',
    whyAdded: "World's most consumed vegetable oil; food manufacturing input and biofuel feedstock.",
    contextCopy: 'Palm oil is present in roughly half of all packaged food products — from spreads and baked goods to infant formula and confectionery. It is also the primary substitute when sunflower or rapeseed oil tightens. For food manufacturers and retailers with large own-label ranges, palm oil price movements are one of the broadest and most immediate ingredient cost signals available.',
  },

  // ── Dairy ─────────────────────────────────────────────────────────────
  {
    symbol: 'BUTTER',
    name: 'Butter',
    layer: 'dairy',
    section: 'food',
    source: 'commoditypriceapi',
    unit: ' €/ton',
    currency: 'EUR',
    decimals: 2,
    color: '#F39C12',
    whyAdded: 'Leading EU dairy price indicator; signals dairy market tightness and food manufacturing input costs.',
    contextCopy: 'Butter is the leading price indicator for the European dairy market. For dairy processors, bakeries, and food manufacturers using dairy fats, butter prices signal broader tightness in milk supply and processing capacity. Movements here typically lead changes in cream, cheese, and skimmed milk powder pricing by four to six weeks.',
  },

  // ── Shipping ──────────────────────────────────────────────────────────
  {
    symbol: 'BDRY',
    name: 'Dry Bulk Freight (BDRY ETF)',
    layer: 'shipping',
    section: 'shipping',
    source: 'yahoo',
    unit: ' $',
    currency: 'USD',
    decimals: 2,
    color: 'var(--shipping)',
    whyAdded: 'Baltic Dry Index proxy ETF; tracks bulk shipping costs for grain, coal, and raw materials.',
  },
  {
    symbol: 'MAERSK-B.CO',
    name: 'Maersk (Copenhagen)',
    layer: 'shipping',
    section: 'shipping',
    source: 'yahoo',
    unit: ' DKK',
    currency: 'DKK',
    decimals: 2,
    color: '#0074D9',
    whyAdded: 'Largest container shipping line; proxy for global container freight rate trends.',
  },
  {
    symbol: 'HLAG.DE',
    name: 'Hapag-Lloyd (Frankfurt)',
    layer: 'shipping',
    section: 'shipping',
    source: 'yahoo',
    unit: ' €',
    currency: 'EUR',
    decimals: 2,
    color: '#FF851B',
    whyAdded: 'Major European container carrier; reflects EU-linked container shipping cost dynamics.',
  },
  {
    symbol: '1919.HK',
    name: 'COSCO Shipping (Hong Kong)',
    layer: 'shipping',
    section: 'shipping',
    source: 'yahoo',
    unit: ' HKD',
    currency: 'HKD',
    decimals: 2,
    color: '#FF4136',
    whyAdded: 'Major Asia-Europe container carrier; signals Far East trade route cost pressures.',
  },

  // ── Synthetic ─────────────────────────────────────────────────────────
  {
    symbol: 'CONTAINER-INDEX',
    name: 'Container Shipping Index',
    layer: 'shipping',
    section: 'shipping',
    source: 'synthetic',
    unit: '',
    currency: 'INDEX',
    decimals: 2,
    color: '#2ECC71',
    whyAdded: 'Synthetic equal-weight index of three major carriers; aggregate proxy for global container freight trends.',
    synthetic: {
      components: ['MAERSK-B.CO', 'HLAG.DE', '1919.HK'],
      baseValue: 100,
    },
  },
]

export default COMMODITY_CONFIG

// ── Derived lookups (computed once at module load) ──────────────────────

/** Map: symbol → config entry */
export const CONFIG_BY_SYMBOL = Object.freeze(
  Object.fromEntries(COMMODITY_CONFIG.map((c) => [c.symbol, c]))
)

/** All unique symbols */
export const ALL_SYMBOLS = Object.freeze(COMMODITY_CONFIG.map((c) => c.symbol))

/** Symbols grouped by source */
export const SYMBOLS_BY_SOURCE = Object.freeze({
  commoditypriceapi: COMMODITY_CONFIG.filter((c) => c.source === 'commoditypriceapi').map((c) => c.symbol),
  yahoo: COMMODITY_CONFIG.filter((c) => c.source === 'yahoo').map((c) => c.symbol),
  synthetic: COMMODITY_CONFIG.filter((c) => c.source === 'synthetic').map((c) => c.symbol),
})

/** Symbols grouped by section (for UI filtering) */
export const SYMBOLS_BY_SECTION = Object.freeze(
  COMMODITY_CONFIG.reduce((acc, c) => {
    if (!acc[c.section]) acc[c.section] = []
    acc[c.section].push(c.symbol)
    return acc
  }, {})
)

/** The synthetic index config (if any) */
export const SYNTHETIC_CONFIGS = Object.freeze(
  COMMODITY_CONFIG.filter((c) => c.source === 'synthetic')
)

/** Container index component symbols */
export const CONTAINER_COMPONENTS = Object.freeze(
  COMMODITY_CONFIG.find((c) => c.symbol === 'CONTAINER-INDEX')?.synthetic?.components ?? []
)

/** Filter tabs — hardcoded to match the five dashboard sections */
export const FILTER_TABS = Object.freeze([
  { id: 'ALL', label: 'All' },
  { id: 'commodities', label: 'Commodities' },
  { id: 'fertilizers', label: 'Fertilizers' },
  { id: 'food', label: 'Food' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'macro', label: 'Macro' },
])
