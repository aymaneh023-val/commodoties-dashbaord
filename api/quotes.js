import { createClient } from '@supabase/supabase-js'

const CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutes

// Fallback tickers — tried in order if the primary fails
const FALLBACKS = { 'BZ=F': 'CB=F' }

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
}

// Replicates the client-side formatDate so chart axis labels are consistent
function formatDate(ts) {
  const d = new Date(ts * 1000)
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  const day = d.getDate()
  const year = String(d.getFullYear()).slice(2)
  return `${month} ${day} '${year}`
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
  const timestamps = result.timestamp ?? []
  const closes = result.indicators?.quote?.[0]?.close ?? []

  // Rice (ZR=F): Yahoo returns USD/cwt; normalize to ¢/cwt to match other grain units
  const norm =
    ticker === 'ZR=F'
      ? (v) => (v != null ? parseFloat((v * 100).toFixed(2)) : null)
      : (v) => (v != null ? parseFloat(v.toFixed(4)) : null)

  const history = timestamps
    .map((ts, i) => ({ date: formatDate(ts), close: norm(closes[i]) }))
    .filter((d) => d.close != null)

  const price = norm(rawPrice)
  const firstClose = history[0]?.close ?? null
  const change_pct =
    firstClose != null ? parseFloat((((price - firstClose) / firstClose) * 100).toFixed(4)) : null

  return { price, change_pct, history }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { tickers: tickerParam } = req.query
  if (!tickerParam) return res.status(400).json({ error: 'tickers param required' })

  const tickers = tickerParam.split(',').map((t) => t.trim()).filter(Boolean)
  const supabase = getSupabase()

  const results = await Promise.allSettled(
    tickers.map(async (ticker) => {
      // 1. Check Supabase for a fresh row
      const { data: cached } = await supabase
        .from('prices')
        .select('*')
        .eq('ticker', ticker)
        .order('fetched_at', { ascending: false })
        .limit(1)
        .single()

      if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS) {
        return {
          ticker,
          price: cached.price,
          change_pct: cached.change_pct,
          history: cached.history ?? [],
          fetched_at: cached.fetched_at,
          fromCache: true,
        }
      }

      // 2. Fetch from Yahoo Finance server-side (no CORS restriction)
      const tryTickers = [ticker, FALLBACKS[ticker]].filter(Boolean)
      let parsed = null
      let lastErr = null

      for (const t of tryTickers) {
        try {
          const result = await fetchYahoo(t)
          parsed = parseResult(ticker, result) // always key by original ticker
          break
        } catch (err) {
          lastErr = err
        }
      }

      if (!parsed) {
        // Return stale cached data rather than a hard error
        if (cached) {
          return {
            ticker,
            price: cached.price,
            change_pct: cached.change_pct,
            history: cached.history ?? [],
            fetched_at: cached.fetched_at,
            fromCache: true,
            stale: true,
          }
        }
        throw lastErr ?? new Error(`Failed to fetch ${ticker}`)
      }

      // 3. Persist fresh data to Supabase
      await supabase.from('prices').insert({
        ticker,
        price: parsed.price,
        change_pct: parsed.change_pct,
        history: parsed.history,
      })

      return {
        ticker,
        price: parsed.price,
        change_pct: parsed.change_pct,
        history: parsed.history,
        fetched_at: new Date().toISOString(),
        fromCache: false,
      }
    })
  )

  const data = results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value
    console.error(`quotes: ${tickers[i]} error:`, r.reason?.message)
    return { ticker: tickers[i], price: null, change_pct: null, history: [], error: r.reason?.message ?? 'fetch failed' }
  })

  return res.status(200).json({ status: 'ok', data })
}
