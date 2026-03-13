export const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY || ''

export const NEWS_QUERY =
  '"energy prices" OR "LNG Europe" OR "oil shock" OR "food supply chain" OR "fertilizer" OR "Iran oil" OR "shipping disruption" OR "Strait of Hormuz"'

export const SOURCE_COLORS = {
  reuters: '#f59e0b',
  ft: '#e11d48',
  bloomberg: '#3b82f6',
  iea: '#22c55e',
  default: '#8890B5',
}

export const NEWS_CATEGORY_KEYWORDS = {
  oil:        ['oil', 'crude', 'brent', 'wti', 'opec', 'petroleum', 'iran oil', 'hormuz'],
  gas:        ['gas', 'lng', 'natural gas', 'ttf', 'energy prices', 'lng europe'],
  shipping:   ['shipping', 'freight', 'baltic', 'container', 'red sea', 'suez', 'strait of hormuz'],
  fertilizer: ['fertilizer', 'fertiliser', 'mosaic', 'potash', 'nitrogen', 'food supply'],
  inflation:  ['inflation', 'hicp', 'cpi', 'food prices', 'food supply chain'],
  metals:     ['gold', 'aluminium', 'aluminum', 'copper', 'steel', 'precious metals'],
  dairy:      ['dairy', 'butter', 'milk', 'cheese'],
}

export const REFRESH_INTERVAL_COMMODITY = 5 * 60 * 1000
export const REFRESH_INTERVAL_NEWS = 15 * 60 * 1000
