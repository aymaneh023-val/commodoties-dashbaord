import { createClient } from '@supabase/supabase-js'

const CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutes

// Fallback tickers — tried in order if the primary fails
const FALLBACKS = { 'BZ=F': 'CB=F' }

// Full ticker list — used when ?tickers=ALL (cron job and manual force-refresh)
const ALL_TICKERS = 'BZ=F,TTF=F,BDRY,ZIM,UFB=F,ZW=F,ZC=F,ZS=F,ZL=F,SB=F'

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
}

async function fetchYahoo(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=30d`
  const r = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EU-Energy-Monitor/1.0)' },
    signal: AbortSignal.timeout(10000),
  })
  if (!r.ok) throw new Error(`Yahoo ${ticker}: ${r.status}`)
  const json = await r.json()
  const result = json.chart?.result?.[0]
  if (!result) throw new Error(`Yahoo ${ticker}: no result`)
  return result
}

function parseResult(ticker, result) {
  const rawPrice = result.meta.regularMarketPrice
  const closes = result.indicators?.quote?.[0]?.close ?? []

  const norm = (v) => (v != null ? parseFloat(v.toFixed(4)) : null)

  // Find first valid close to compute 30-day change_pct
  let firstClose = null
  for (const c of closes) {
    if (c != null) { firstClose = norm(c); break }
  }

  const price = norm(rawPrice)
  const change_pct =
    firstClose != null ? parseFloat((((price - firstClose) / firstClose) * 100).toFixed(4)) : null

  return { price, change_pct }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { tickers: tickerParam, force } = req.query
  if (!tickerParam) return res.status(400).json({ error: 'tickers param required' })

  const forceRefresh = force === 'true' || force === '1'
  const rawList = tickerParam === 'ALL' ? ALL_TICKERS : tickerParam
  const tickers = rawList.split(',').map((t) => t.trim()).filter(Boolean)
  const supabase = getSupabase()

  const results = await Promise.allSettled(
    tickers.map(async (ticker) => {
      // 1. Check Supabase for a fresh row
      const { data: cached } = await supabase
        .from('prices')
        .select('id, ticker, price, change_pct, fetched_at')
        .eq('ticker', ticker)
        .order('fetched_at', { ascending: false })
        .limit(1)
        .single()

      if (!forceRefresh && cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS) {
        return { ticker, price: cached.price, change_pct: cached.change_pct, fetched_at: cached.fetched_at, fromCache: true }
      }

      // 2. Fetch from Yahoo Finance server-side (no CORS restriction)
      const tryTickers = [ticker, FALLBACKS[ticker]].filter(Boolean)
      let parsed = null
      let lastErr = null

      for (const t of tryTickers) {
        try {
          const result = await fetchYahoo(t)
          parsed = parseResult(ticker, result)
          break
        } catch (err) {
          lastErr = err
        }
      }

      if (!parsed) {
        // Return stale cached row rather than a hard error
        if (cached) {
          return { ticker, price: cached.price, change_pct: cached.change_pct, fetched_at: cached.fetched_at, fromCache: true, stale: true }
        }
        throw lastErr ?? new Error(`Failed to fetch ${ticker}`)
      }

      // 3. Append new observation to Supabase (no upsert — every fetch is its own row)
      await supabase.from('prices').insert({ ticker, price: parsed.price, change_pct: parsed.change_pct })

      return { ticker, price: parsed.price, change_pct: parsed.change_pct, fetched_at: new Date().toISOString(), fromCache: false }
    })
  )

  const data = results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value
    console.error(`quotes: ${tickers[i]} error:`, r.reason?.message)
    return { ticker: tickers[i], price: null, change_pct: null, error: r.reason?.message ?? 'fetch failed' }
  })

  // Most recent fetched_at across all rows — represents when data was last stored
  const lastUpdated = data.reduce((max, r) => {
    if (!r.fetched_at) return max
    return !max || r.fetched_at > max ? r.fetched_at : max
  }, null)

  return res.status(200).json({ status: 'ok', data, lastUpdated })
}
