import { useState, useEffect, useCallback, useRef } from 'react'
import { TICKERS, YAHOO_BASE, CORS_PROXIES } from '../utils/constants'
import { formatDate } from '../utils/formatters'

async function fetchWithProxy(url) {
  for (const proxy of CORS_PROXIES) {
    try {
      const res = await fetch(proxy(url), { signal: AbortSignal.timeout(8000) })
      if (res.ok) {
        const text = await res.text()
        return JSON.parse(text)
      }
    } catch {
      // try next proxy
    }
  }
  throw new Error('All proxies failed')
}

function parseTickerData(json) {
  try {
    const result = json.chart.result[0]
    const meta = result.meta
    const price = meta.regularMarketPrice
    const prevClose = meta.chartPreviousClose
    const pctChange = prevClose ? ((price - prevClose) / prevClose) * 100 : null

    const timestamps = result.timestamp || []
    const closes = result.indicators?.quote?.[0]?.close || []

    const history = timestamps
      .map((ts, i) => ({
        date: formatDate(ts),
        close: closes[i] != null ? parseFloat(closes[i].toFixed(2)) : null,
      }))
      .filter((d) => d.close != null)

    return { price, prevClose, pctChange, history, error: false }
  } catch {
    return { price: null, prevClose: null, pctChange: null, history: [], error: true }
  }
}

const initialState = {
  price: null,
  prevClose: null,
  pctChange: null,
  history: [],
  loading: true,
  error: false,
}

export function useCommodityData() {
  const [data, setData] = useState({
    brent: { ...initialState },
    wti: { ...initialState },
    ttf: { ...initialState },
    bdi: { ...initialState },
    lng: { ...initialState },
    mos: { ...initialState },
  })

  // Keep last known good values so we never go blank
  const lastGood = useRef({})

  const fetchAll = useCallback(async () => {
    const entries = Object.entries(TICKERS)

    // Mark all as loading (but keep current values visible)
    setData((prev) => {
      const next = { ...prev }
      entries.forEach(([key]) => {
        next[key] = { ...prev[key], loading: true }
      })
      return next
    })

    const results = await Promise.allSettled(
      entries.map(async ([key, ticker]) => {
        const url = `${YAHOO_BASE}/${ticker}?interval=1d&range=30d`
        const json = await fetchWithProxy(url)
        const parsed = parseTickerData(json)
        return { key, ...parsed }
      })
    )

    setData((prev) => {
      const next = { ...prev }
      results.forEach((result, i) => {
        const key = entries[i][0]
        if (result.status === 'fulfilled' && !result.value.error) {
          const val = result.value
          lastGood.current[key] = { price: val.price, prevClose: val.prevClose, pctChange: val.pctChange, history: val.history }
          next[key] = { ...val, loading: false, error: false }
        } else {
          // Keep last good value, flag error
          const lg = lastGood.current[key] || {}
          next[key] = {
            price: lg.price ?? null,
            prevClose: lg.prevClose ?? null,
            pctChange: lg.pctChange ?? null,
            history: lg.history ?? [],
            loading: false,
            error: true,
          }
        }
      })
      return next
    })
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return { data, refresh: fetchAll }
}
