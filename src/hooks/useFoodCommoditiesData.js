import { useState, useEffect, useCallback } from 'react'
import { YAHOO_BASE, CORS_PROXIES } from '../utils/constants'
import { formatDate } from '../utils/formatters'

const memCache = {}

export const FOOD_TICKERS = {
  wheat:       'ZW=F',
  corn:        'ZC=F',
  soybeans:    'ZS=F',
  soybeanOil:  'ZL=F',
  soybeanMeal: 'ZM=F',
  rice:        'ZR=F',
  sugar:       'SB=F',
  palm:        'FCPO=F',
  natgas:      'NG=F',
}

export const FOOD_META = {
  wheat:       { label: 'Wheat',            unit: ' ¢/bu',  note: 'CBOT global wheat benchmark' },
  corn:        { label: 'Corn',             unit: ' ¢/bu',  note: 'Primary animal feed crop' },
  soybeans:    { label: 'Soybeans',         unit: ' ¢/bu',  note: 'Oil + protein supply chain' },
  soybeanOil:  { label: 'Soybean Oil',      unit: ' ¢/lb',  note: 'Vegetable oil inflation proxy' },
  soybeanMeal: { label: 'Soybean Meal',     unit: ' $/ton', note: 'Animal feed — links soy to meat prices' },
  rice:        { label: 'Rice',             unit: ' ¢/cwt', note: 'Asia food security indicator' },
  sugar:       { label: 'Sugar',            unit: ' ¢/lb',  note: 'Global calorie inflation signal' },
  palm:        { label: 'Palm Oil',         unit: ' MYR/t', note: '35-40% of global vegetable oil supply' },
  natgas:      { label: 'Natural Gas',      unit: ' $/MMBtu', note: 'Upstream driver: gas → fertilizer → food' },
}

const delay = ms => new Promise(r => setTimeout(r, ms))

async function fetchWithRetry(url) {
  for (let attempt = 0; attempt < 2; attempt++) {
    for (const proxy of CORS_PROXIES) {
      try {
        const res = await fetch(proxy(url), { signal: AbortSignal.timeout(8000) })
        if (res.ok) {
          const json = JSON.parse(await res.text())
          if (json?.chart?.result?.[0]) return json
        }
      } catch { /* try next */ }
    }
    if (attempt === 0) await delay(2000)
  }
  throw new Error('All proxies failed')
}

function parseTicker(json) {
  try {
    const result = json.chart.result[0]
    const price = result.meta.regularMarketPrice
    const timestamps = result.timestamp || []
    const closes = result.indicators?.quote?.[0]?.close || []
    const history = timestamps
      .map((ts, i) => ({
        date: formatDate(ts),
        close: closes[i] != null ? parseFloat(closes[i].toFixed(4)) : null,
      }))
      .filter(d => d.close != null)
    const firstClose = history[0]?.close ?? null
    const pctChange = firstClose ? ((price - firstClose) / firstClose) * 100 : null
    const baseDate = history[0]?.date ?? null
    return { price, pctChange, baseDate, history, error: false }
  } catch {
    return { price: null, pctChange: null, baseDate: null, history: [], error: true }
  }
}

async function fetchTicker(key, ticker) {
  const url = `${YAHOO_BASE}/${ticker}?interval=1d&range=30d`
  try {
    const json = await fetchWithRetry(url)
    const parsed = parseTicker(json)
    if (!parsed.error) {
      memCache[key] = { ...parsed, cachedAt: Date.now() }
      return { key, ...parsed, fromCache: false }
    }
    throw new Error('Parse error')
  } catch {
    const c = memCache[key]
    if (c) return { key, ...c, fromCache: true, cacheAge: Math.round((Date.now() - c.cachedAt) / 60000), error: false }
    return { key, price: null, pctChange: null, baseDate: null, history: [], error: true, fromCache: false }
  }
}

const initialState = { price: null, pctChange: null, baseDate: null, history: [], loading: true, error: false, fromCache: false }

export function useFoodCommoditiesData() {
  const [data, setData] = useState(() => {
    const s = {}
    Object.keys(FOOD_TICKERS).forEach(k => { s[k] = { ...initialState } })
    return s
  })

  const fetchAll = useCallback(async () => {
    setData(prev => {
      const next = {}
      Object.keys(prev).forEach(k => { next[k] = { ...prev[k], loading: true } })
      return next
    })

    const entries = Object.entries(FOOD_TICKERS)
    const results = await Promise.allSettled(
      entries.map(([key, ticker], i) => delay(300 * i).then(() => fetchTicker(key, ticker)))
    )

    setData(prev => {
      const next = { ...prev }
      results.forEach(r => {
        if (r.status === 'fulfilled' && r.value?.key) {
          const { key, ...rest } = r.value
          next[key] = { ...rest, loading: false }
        }
      })
      return next
    })
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  return { data, refresh: fetchAll }
}
