// Serves 30-day chart history for any ticker, fetched live from Yahoo Finance.
// Never reads from or writes to Supabase — charts are always fresh.

// Replicates client-side formatDate so axis labels are consistent
function formatDate(ts) {
  const d = new Date(ts * 1000)
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  const day = d.getDate()
  const year = String(d.getFullYear()).slice(2)
  return `${month} ${day} '${year}`
}

async function fetchHistory(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=30d`
  const r = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EU-Energy-Monitor/1.0)' },
    signal: AbortSignal.timeout(10000),
  })
  if (!r.ok) throw new Error(`Yahoo ${ticker}: ${r.status}`)
  const json = await r.json()
  const result = json.chart?.result?.[0]
  if (!result) throw new Error(`Yahoo ${ticker}: no result`)

  const timestamps = result.timestamp ?? []
  const closes = result.indicators?.quote?.[0]?.close ?? []

  // Rice (ZR=F): normalize USD/cwt → ¢/cwt
  const norm =
    ticker === 'ZR=F'
      ? (v) => (v != null ? parseFloat((v * 100).toFixed(2)) : null)
      : (v) => (v != null ? parseFloat(v.toFixed(4)) : null)

  const history = timestamps
    .map((ts, i) => ({ date: formatDate(ts), close: norm(closes[i]) }))
    .filter((d) => d.close != null)

  return { ticker, history }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { tickers: tickerParam } = req.query
  if (!tickerParam) return res.status(400).json({ error: 'tickers param required' })

  const tickers = tickerParam.split(',').map((t) => t.trim()).filter(Boolean)

  const results = await Promise.allSettled(tickers.map(fetchHistory))

  const data = results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value
    console.error(`history: ${tickers[i]} error:`, r.reason?.message)
    return { ticker: tickers[i], history: [] }
  })

  return res.status(200).json({ status: 'ok', data })
}
