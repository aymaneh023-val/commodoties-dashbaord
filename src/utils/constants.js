export const TICKERS = {
  brent: 'BZ=F',   // Brent crude (with CB=F fallback handled in hook)
  wti:   'CL=F',
  ttf:   'TTF=F',
  bdry:  'BDRY',   // Breakwave Dry Bulk ETF — BDI proxy
  zim:   'ZIM',    // ZIM Integrated Shipping — container proxy
  matx:  'MATX',   // Matson — container confirmation
  lng:   'LNG',
  urea:  'UFB=F',  // Urea futures — nitrogen fertilizer benchmark
}

export const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart'

export const CORS_PROXIES = [
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.org/?${encodeURIComponent(url)}`,
]

export const EUROSTAT_HEADLINE =
  'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_mmor?geo=EA&coicop=CP00&lastTimePeriods=13'

export const EUROSTAT_FOOD =
  'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_mmor?geo=EA&coicop=CP01&lastTimePeriods=13'

export const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY || ''

export const NEWS_QUERY =
  '"energy prices" OR "LNG Europe" OR "oil shock" OR "food supply chain" OR "fertilizer" OR "Iran oil" OR "shipping disruption" OR "Strait of Hormuz"'

export const SOURCE_COLORS = {
  reuters: '#f59e0b',
  ft: '#e11d48',
  bloomberg: '#3b82f6',
  iea: '#22c55e',
  default: '#6b7fa3',
}

export const FILTER_TABS = [
  { id: 'ALL',         label: 'ALL',         emoji: '' },
  { id: 'risk',        label: 'Geopolitics', emoji: '' },
  { id: 'oil',         label: 'Oil',         emoji: '🛢️' },
  { id: 'gas',         label: 'Gas & LNG',   emoji: '⚡' },
  { id: 'shipping',    label: 'Shipping',    emoji: '🚢' },
  { id: 'chokepoints', label: 'Chokepoints', emoji: '🗺' },
  { id: 'fertilizer',  label: 'Fertilizer',  emoji: '🌾' },
  { id: 'food',        label: 'Food',        emoji: '🌿' },
  { id: 'inflation',   label: 'Inflation',   emoji: '📈' },
  { id: 'compare',     label: 'Compare',     emoji: '📊' },
]

export const TICKER_LABELS = {
  brent: 'Brent',
  wti:   'WTI',
  ttf:   'TTF Gas',
  bdry:  'BDRY',
  zim:   'ZIM',
  matx:  'MATX',
  lng:   'LNG',
  urea:  'Urea',
}

export const NEWS_CATEGORY_KEYWORDS = {
  oil:        ['oil', 'crude', 'brent', 'wti', 'opec', 'petroleum', 'iran oil', 'hormuz'],
  gas:        ['gas', 'lng', 'natural gas', 'ttf', 'energy prices', 'lng europe'],
  shipping:   ['shipping', 'freight', 'baltic', 'container', 'red sea', 'suez', 'strait of hormuz'],
  fertilizer: ['fertilizer', 'fertiliser', 'mosaic', 'potash', 'nitrogen', 'food supply'],
  inflation:  ['inflation', 'hicp', 'cpi', 'food prices', 'food supply chain'],
}

export const REFRESH_INTERVAL_COMMODITY = 5 * 60 * 1000
export const REFRESH_INTERVAL_NEWS = 15 * 60 * 1000
