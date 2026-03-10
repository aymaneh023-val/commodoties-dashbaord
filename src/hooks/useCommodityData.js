import { useState, useEffect, useCallback, useRef } from 'react'
import { YAHOO_BASE, CORS_PROXIES } from '../utils/constants'
import { formatDate } from '../utils/formatters'

// Module-level cache — survives React re-renders and manual refreshes
const memCache = {}

// Brent has a fallback ticker list (BZ=F is sometimes rate-limited)
const BRENT_TICKERS = ['BZ=F', 'CB=F']

// All other tickers — fetched with 300ms stagger between each
const OTHER_TICKERS = {
  ttf:  'TTF=F',
  bdry: 'BDRY',
  zim:  'ZIM',
  urea: 'UFB=F',
}

const delay = (ms) => new Promise(r => setTimeout(r, ms))

// After the initial attempt fails, retry at these intervals (ms)
const RETRY_DELAYS = [4000, 10000, 25000]

// Try every proxy; if all fail, wait 2s and retry once
async function fetchWithRetry(url) {
  for (let attempt = 0; attempt < 2; attempt++) {
    for (const proxy of CORS_PROXIES) {
      try {
        const res = await fetch(proxy(url), { signal: AbortSignal.timeout(8000) })
        if (res.ok) {
          const json = JSON.parse(await res.text())
          if (json?.chart?.result?.[0]) return json
        }
      } catch { /* try next proxy */ }
    }
    if (attempt === 0) await delay(2000)
  }
  throw new Error(`All proxies failed for: ${url}`)
}

function parseTickerData(json) {
  try {
    const result = json.chart.result[0]
    const meta = result.meta
    const price = meta.regularMarketPrice
    const timestamps = result.timestamp || []
    const closes = result.indicators?.quote?.[0]?.close || []
    const history = timestamps
      .map((ts, i) => ({
        date: formatDate(ts),
        close: closes[i] != null ? parseFloat(closes[i].toFixed(2)) : null,
      }))
      .filter((d) => d.close != null)
    if (!price || history.length === 0) return { price: null, pctChange: null, baseDate: null, history: [], error: true }
    // 30-day % change vs first available history point
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
  try {
    const url = `${YAHOO_BASE}/${ticker}?interval=1d&range=30d`
    const json = await fetchWithRetry(url)
    const parsed = parseTickerData(json)
    if (!parsed.error) {
      memCache[key] = { ...parsed, cachedAt: Date.now() }
      return { key, ...parsed, fromCache: false }
    }
    throw new Error('Parse error')
  } catch {
    return fromCacheResult(key) ?? errorResult(key)
  }
}

async function fetchBrent() {
  for (const ticker of BRENT_TICKERS) {
    try {
      const url = `${YAHOO_BASE}/${ticker}?interval=1d&range=30d`
      const json = await fetchWithRetry(url)
      const parsed = parseTickerData(json)
      if (!parsed.error) {
        memCache['brent'] = { ...parsed, cachedAt: Date.now() }
        return { key: 'brent', ...parsed, fromCache: false }
      }
    } catch { /* try next Brent ticker */ }
  }
  return fromCacheResult('brent') ?? errorResult('brent')
}

const initialState = {
  price: null, pctChange: null, baseDate: null,
  history: [], loading: true, error: false, fromCache: false,
}

export function useCommodityData() {
  const [data, setData] = useState({
    brent: { ...initialState },
    ttf:   { ...initialState },
    bdry:  { ...initialState },
    zim:   { ...initialState },
    urea:  { ...initialState },
  })

  // Incremented on every refresh — running loops from a previous generation
  // check this and bail out immediately so stale retries don't overwrite new data.
  const genRef = useRef(0)

  const fetchAll = useCallback(() => {
    const gen = ++genRef.current

    // Mark all as loading (keep current values visible while refreshing)
    setData(prev => {
      const next = {}
      Object.keys(prev).forEach(k => { next[k] = { ...prev[k], loading: true } })
      return next
    })

    // All keys in one flat list — each gets its own independent retry loop.
    const allEntries = [['brent', null], ...Object.entries(OTHER_TICKERS)]

    allEntries.forEach(([key, ticker], i) => {
      const run = async () => {
        // Stagger initial attempts 300ms apart (same as before)
        await delay(300 * i)
        if (genRef.current !== gen) return

        for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
          // Wait before retry (skip on first attempt)
          if (attempt > 0) {
            await delay(RETRY_DELAYS[attempt - 1])
            if (genRef.current !== gen) return
          }

          const result = key === 'brent'
            ? await fetchBrent()
            : await fetchTicker(key, ticker)

          if (genRef.current !== gen) return

          if (!result.error) {
            // Got real data — update this ticker and stop retrying
            const { key: _k, ...rest } = result
            setData(prev => ({ ...prev, [key]: { ...rest, loading: false } }))
            return
          }

          // Failed — if we have stale cached data, surface it while retrying
          if (result.fromCache) {
            const { key: _k, ...rest } = result
            setData(prev => ({ ...prev, [key]: { ...rest, loading: true } }))
          }
        }

        // All retries exhausted — show cache if available, otherwise hard error
        const fallback = fromCacheResult(key) ?? errorResult(key)
        setData(prev => ({ ...prev, [key]: { ...fallback, loading: false } }))
      }

      run()
    })
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  return { data, refresh: fetchAll }
}
