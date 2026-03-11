import { useState, useEffect, useCallback, useRef } from 'react'
import { YAHOO_BASE, CORS_PROXIES } from '../utils/constants'
import { formatDate } from '../utils/formatters'

const memCache = {}

export const FOOD_TICKERS = {
  wheat:       'ZW=F',
  corn:        'ZC=F',
  soybeans:    'ZS=F',
  soybeanOil:  'ZL=F',
  rice:        'ZR=F',
  sugar:       'SB=F',
}

export const FOOD_META = {
  wheat:       { label: 'Wheat',            unit: ' ¢/bu',  note: 'CBOT Wheat (ZW=F). Global benchmark.' },
  corn:        { label: 'Corn',             unit: ' ¢/bu',  note: 'CBOT Corn (ZC=F). Primary feed grain.' },
  soybeans:    { label: 'Soybeans',         unit: ' ¢/bu',  note: 'CBOT Soybeans (ZS=F). Oil and protein crop.' },
  soybeanOil:  { label: 'Soybean Oil',      unit: ' ¢/lb',  note: 'CBOT Soybean Oil (ZL=F). Vegetable oil benchmark.' },
  rice:        { label: 'Rice',             unit: ' ¢/cwt', note: 'CBOT Rough Rice (ZR=F). US contract.' },
  sugar:       { label: 'Sugar',            unit: ' ¢/lb',  note: 'ICE Sugar No.11 (SB=F). Global raw sugar.' },
}

const delay = ms => new Promise(r => setTimeout(r, ms))

const RETRY_DELAYS = [2000, 5000, 12000]

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
    if (!price || history.length === 0) return { price: null, pctChange: null, baseDate: null, history: [], error: true }
    const firstClose = history[0]?.close ?? null
    const pctChange = firstClose ? ((price - firstClose) / firstClose) * 100 : null
    const baseDate = history[0]?.date ?? null
    return { price, pctChange, baseDate, history, error: false }
  } catch {
    return { price: null, pctChange: null, baseDate: null, history: [], error: true }
  }
}

function fromCacheResult(key) {
  const c = memCache[key]
  if (!c) return null
  return { key, ...c, fromCache: true, cacheAge: Math.round((Date.now() - c.cachedAt) / 60000), error: false }
}

function errorResult(key) {
  return { key, price: null, pctChange: null, baseDate: null, history: [], error: true, fromCache: false }
}

async function fetchTicker(key, ticker) {
  const url = `${YAHOO_BASE}/${ticker}?interval=1d&range=30d`
  try {
    const json = await fetchWithRetry(url)
    if (key === 'rice') {
      const r = json?.chart?.result?.[0]
      console.log('[rice raw]', {
        price: r?.meta?.regularMarketPrice,
        history: r?.indicators?.quote?.[0]?.close?.slice(0, 5),
        timestamps: r?.timestamp?.slice(0, 5),
      })
    }
    const parsed = parseTicker(json)
    if (!parsed.error) {
      memCache[key] = { ...parsed, cachedAt: Date.now() }
      return { key, ...parsed, fromCache: false }
    }
    throw new Error('Parse error')
  } catch {
    return fromCacheResult(key) ?? errorResult(key)
  }
}

const initialState = { price: null, pctChange: null, baseDate: null, history: [], loading: true, error: false, fromCache: false }

export function useFoodCommoditiesData() {
  const [data, setData] = useState(() => {
    const s = {}
    Object.keys(FOOD_TICKERS).forEach(k => { s[k] = { ...initialState } })
    return s
  })

  const genRef = useRef(0)

  const fetchAll = useCallback(() => {
    const gen = ++genRef.current

    setData(prev => {
      const next = {}
      Object.keys(prev).forEach(k => { next[k] = { ...prev[k], loading: true } })
      return next
    })

    const entries = Object.entries(FOOD_TICKERS)

    entries.forEach(([key, ticker], i) => {
      const run = async () => {
        await delay(300 * i)
        if (genRef.current !== gen) return

        for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
          if (attempt > 0) {
            await delay(RETRY_DELAYS[attempt - 1])
            if (genRef.current !== gen) return
          }

          const result = await fetchTicker(key, ticker)
          if (genRef.current !== gen) return

          if (!result.error) {
            const { key: _k, ...rest } = result
            setData(prev => ({ ...prev, [key]: { ...rest, loading: false } }))
            return
          }

          if (result.fromCache) {
            const { key: _k, ...rest } = result
            setData(prev => ({ ...prev, [key]: { ...rest, loading: true } }))
          }
        }

        const fallback = fromCacheResult(key) ?? errorResult(key)
        setData(prev => ({ ...prev, [key]: { ...fallback, loading: false } }))
      }

      run()
    })
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  return { data, refresh: fetchAll }
}
