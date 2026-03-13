import { createClient } from '@supabase/supabase-js'

let _supabase = null

export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  }
  return _supabase
}

/**
 * Upsert rows into commodity_timeseries (raw table).
 * Idempotent on (symbol, date). Batches in chunks of 500.
 */
export async function upsertTimeseries(rows) {
  const supabase = getSupabase()
  const BATCH = 500
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const { error } = await supabase
      .from('commodity_timeseries')
      .upsert(batch, { onConflict: 'symbol,date' })
    if (error) throw new Error(`Supabase upsert raw batch ${i}: ${error.message}`)
  }
}

/**
 * Upsert rows into commodity_timeseries_computed (derived/synthetic table).
 * Rows should include method + components fields.
 * Idempotent on (symbol, date). Batches in chunks of 500.
 */
export async function upsertComputed(rows) {
  const supabase = getSupabase()
  const BATCH = 500
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const { error } = await supabase
      .from('commodity_timeseries_computed')
      .upsert(batch, { onConflict: 'symbol,date' })
    if (error) throw new Error(`Supabase upsert computed batch ${i}: ${error.message}`)
  }
}

/**
 * Fetch timeseries from CommodityPriceAPI for a batch of symbols.
 * Returns array of { symbol, date, open, high, low, close, source }.
 */
export async function fetchCPATimeseries(symbols, startDate, endDate) {
  const apiKey = process.env.COMMODITY_API_KEY
  if (!apiKey) throw new Error('COMMODITY_API_KEY not set')

  const url =
    `https://api.commoditypriceapi.com/v2/rates/time-series` +
    `?apiKey=${apiKey}` +
    `&symbols=${symbols.join(',')}` +
    `&startDate=${startDate}` +
    `&endDate=${endDate}`

  const r = await fetch(url, {
    headers: { 'User-Agent': 'EU-Energy-Monitor/2.0' },
    signal: AbortSignal.timeout(30000),
  })
  if (!r.ok) {
    const body = await r.text().catch(() => '')
    throw new Error(`CPA timeseries ${r.status}: ${body.substring(0, 200)}`)
  }

  const json = await r.json()
  if (!json.success) throw new Error(`CPA timeseries error: ${JSON.stringify(json)}`)

  const rows = []
  const rates = json.rates ?? {}
  for (const [date, symbolMap] of Object.entries(rates)) {
    for (const [sym, ohlc] of Object.entries(symbolMap)) {
      if (!symbols.includes(sym)) continue
      rows.push({
        symbol: sym,
        date,
        open: ohlc.open ?? null,
        high: ohlc.high ?? null,
        low: ohlc.low ?? null,
        close: ohlc.close ?? null,
        source: 'commoditypriceapi',
        updated_at: new Date().toISOString(),
      })
    }
  }
  return rows
}

/**
 * Fetch historical rates for a single date from CommodityPriceAPI.
 * Returns array of { symbol, date, open, high, low, close, source }.
 */
export async function fetchCPAHistorical(symbols, date) {
  const apiKey = process.env.COMMODITY_API_KEY
  if (!apiKey) throw new Error('COMMODITY_API_KEY not set')

  const url =
    `https://api.commoditypriceapi.com/v2/rates/historical` +
    `?apiKey=${apiKey}` +
    `&symbols=${symbols.join(',')}` +
    `&date=${date}`

  const r = await fetch(url, {
    headers: { 'User-Agent': 'EU-Energy-Monitor/2.0' },
    signal: AbortSignal.timeout(15000),
  })
  if (!r.ok) {
    const body = await r.text().catch(() => '')
    throw new Error(`CPA historical ${r.status}: ${body.substring(0, 200)}`)
  }

  const json = await r.json()
  if (!json.success) throw new Error(`CPA historical error: ${JSON.stringify(json)}`)

  const rows = []
  const rates = json.rates ?? {}
  for (const [sym, ohlc] of Object.entries(rates)) {
    if (!symbols.includes(sym)) continue
    rows.push({
      symbol: sym,
      date: ohlc.date ?? date,
      open: ohlc.open ?? null,
      high: ohlc.high ?? null,
      low: ohlc.low ?? null,
      close: ohlc.close ?? null,
      source: 'commoditypriceapi',
      updated_at: new Date().toISOString(),
    })
  }
  return rows
}

/**
 * Fetch latest rates (live) from CommodityPriceAPI.
 * Returns array of { symbol, date (today), close, source }.
 */
export async function fetchCPALatest(symbols) {
  const apiKey = process.env.COMMODITY_API_KEY
  if (!apiKey) throw new Error('COMMODITY_API_KEY not set')

  const url =
    `https://api.commoditypriceapi.com/v2/rates/latest` +
    `?apiKey=${apiKey}` +
    `&symbols=${symbols.join(',')}`

  const r = await fetch(url, {
    headers: { 'User-Agent': 'EU-Energy-Monitor/2.0' },
    signal: AbortSignal.timeout(15000),
  })
  if (!r.ok) {
    const body = await r.text().catch(() => '')
    throw new Error(`CPA latest ${r.status}: ${body.substring(0, 200)}`)
  }

  const json = await r.json()
  if (!json.success) throw new Error(`CPA latest error: ${JSON.stringify(json)}`)

  const today = new Date().toISOString().split('T')[0]
  const rows = []
  const rates = json.rates ?? {}
  for (const [sym, price] of Object.entries(rates)) {
    if (!symbols.includes(sym)) continue
    rows.push({
      symbol: sym,
      date: today,
      open: null,
      high: null,
      low: null,
      close: typeof price === 'number' ? price : (price?.close ?? null),
      source: 'commoditypriceapi',
      updated_at: new Date().toISOString(),
    })
  }
  return rows
}

/**
 * Fetch Yahoo Finance chart data for a single ticker.
 * Returns { timestamps[], opens[], highs[], lows[], closes[] }.
 */
export async function fetchYahooChart(ticker, range = '3mo') {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}` +
    `?interval=1d&range=${range}`

  const r = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EU-Energy-Monitor/2.0)' },
    signal: AbortSignal.timeout(15000),
  })
  if (!r.ok) throw new Error(`Yahoo ${ticker}: ${r.status}`)

  const json = await r.json()
  const result = json.chart?.result?.[0]
  if (!result) throw new Error(`Yahoo ${ticker}: no result`)

  const timestamps = result.timestamp ?? []
  const quote = result.indicators?.quote?.[0] ?? {}

  return {
    timestamps,
    opens: quote.open ?? [],
    highs: quote.high ?? [],
    lows: quote.low ?? [],
    closes: quote.close ?? [],
  }
}

/**
 * Convert Yahoo chart data for a ticker into timeseries rows.
 */
export function yahooChartToRows(ticker, chart) {
  const rows = []
  const now = new Date().toISOString()
  for (let i = 0; i < chart.timestamps.length; i++) {
    const close = chart.closes[i]
    if (close == null) continue
    const d = new Date(chart.timestamps[i] * 1000)
    const date = d.toISOString().split('T')[0]
    rows.push({
      symbol: ticker,
      date,
      open: chart.opens[i] != null ? parseFloat(chart.opens[i].toFixed(4)) : null,
      high: chart.highs[i] != null ? parseFloat(chart.highs[i].toFixed(4)) : null,
      low: chart.lows[i] != null ? parseFloat(chart.lows[i].toFixed(4)) : null,
      close: parseFloat(close.toFixed(4)),
      source: 'yahoo',
      updated_at: now,
    })
  }
  return rows
}

/**
 * Compute a synthetic CONTAINER-INDEX from component yahoo rows.
 * Rebased to baseValue (100) on the earliest common date.
 *
 * @param {Object} rowsBySymbol - { 'MAERSK-B.CO': [...rows], 'HLAG.DE': [...], '1919.HK': [...] }
 * @param {string[]} components - component symbol names
 * @param {number} baseValue - starting index value (100)
 * @returns {Array} timeseries rows for CONTAINER-INDEX
 */
export function computeContainerIndex(rowsBySymbol, components, baseValue = 100) {
  // Build close maps per component: date → close
  const closeMaps = components.map((sym) => {
    const map = {}
    for (const r of rowsBySymbol[sym] ?? []) {
      map[r.date] = r.close
    }
    return map
  })

  // Find all dates where ALL components have data
  const allDates = new Set()
  for (const map of closeMaps) {
    for (const d of Object.keys(map)) allDates.add(d)
  }
  const commonDates = [...allDates]
    .filter((d) => closeMaps.every((m) => m[d] != null))
    .sort()

  if (commonDates.length === 0) return []

  // Base closes = first common date
  const basePrices = closeMaps.map((m) => m[commonDates[0]])

  const now = new Date().toISOString()
  return commonDates.map((date) => {
    const returns = closeMaps.map((m, i) => (m[date] / basePrices[i]) - 1)
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
    const indexValue = parseFloat((baseValue * (1 + avgReturn)).toFixed(4))

    return {
      symbol: 'CONTAINER-INDEX',
      date,
      open: null,
      high: null,
      low: null,
      close: indexValue,
      source: 'synthetic',
      method: 'equal_weight_rebase_100',
      components,
      updated_at: now,
    }
  })
}
