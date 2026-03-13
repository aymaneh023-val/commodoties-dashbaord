/**
 * Local backfill script — seeds 90 days of data into Supabase.
 * Reads .env from the project root.
 *
 * Usage: node scripts/backfill-local.mjs
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

// ── Config (mirror of api/_shared/config.js) ──
const CPA_SYMBOLS = [
  'BRENTOIL-FUT','TTF-GAS','LGO',
  'UREA','DIAPH',
  'XAU','AL-FUT',
  'ZW-FUT','CORN','SOYBEAN-FUT','PO',
  'BUTTER',
]
const YAHOO_SYMBOLS = ['BDRY','MAERSK-B.CO','HLAG.DE','1919.HK']
const CONTAINER_COMPONENTS = ['MAERSK-B.CO','HLAG.DE','1919.HK']
const BATCH_SIZE = parseInt(process.env.CPA_BATCH_SIZE || '5', 10)

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

function chunk(arr, n) {
  const out = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

async function fetchCPA(symbols, startDate, endDate) {
  const url =
    `https://api.commoditypriceapi.com/v2/rates/time-series` +
    `?apiKey=${process.env.COMMODITY_API_KEY}` +
    `&symbols=${symbols.join(',')}` +
    `&startDate=${startDate}&endDate=${endDate}`
  const r = await fetch(url, {
    headers: { 'User-Agent': 'EU-Energy-Monitor/2.0' },
    signal: AbortSignal.timeout(30000),
  })
  if (!r.ok) throw new Error(`CPA ${r.status}: ${await r.text().catch(() => '')}`)
  const json = await r.json()
  if (!json.success) throw new Error(`CPA error: ${JSON.stringify(json)}`)

  const rows = []
  for (const [date, symbolMap] of Object.entries(json.rates ?? {})) {
    for (const [sym, ohlc] of Object.entries(symbolMap)) {
      if (!symbols.includes(sym)) continue
      rows.push({
        symbol: sym, date,
        open: ohlc.open ?? null, high: ohlc.high ?? null,
        low: ohlc.low ?? null, close: ohlc.close ?? null,
        source: 'commoditypriceapi',
        updated_at: new Date().toISOString(),
      })
    }
  }
  return rows
}

async function fetchYahoo(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=3mo`
  const r = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EU-Energy-Monitor/2.0)' },
    signal: AbortSignal.timeout(15000),
  })
  if (!r.ok) throw new Error(`Yahoo ${ticker}: ${r.status}`)
  const result = (await r.json()).chart?.result?.[0]
  if (!result) throw new Error(`Yahoo ${ticker}: no result`)

  const ts = result.timestamp ?? []
  const q = result.indicators?.quote?.[0] ?? {}
  const now = new Date().toISOString()
  const rows = []
  for (let i = 0; i < ts.length; i++) {
    if (q.close[i] == null) continue
    rows.push({
      symbol: ticker,
      date: new Date(ts[i] * 1000).toISOString().split('T')[0],
      open: q.open[i] != null ? +q.open[i].toFixed(4) : null,
      high: q.high[i] != null ? +q.high[i].toFixed(4) : null,
      low: q.low[i] != null ? +q.low[i].toFixed(4) : null,
      close: +q.close[i].toFixed(4),
      source: 'yahoo',
      updated_at: now,
    })
  }
  return rows
}

function computeContainerIndex(rowsBySymbol) {
  const closeMaps = CONTAINER_COMPONENTS.map((sym) => {
    const map = {}
    for (const r of rowsBySymbol[sym] ?? []) map[r.date] = r.close
    return map
  })
  const allDates = new Set()
  for (const m of closeMaps) for (const d of Object.keys(m)) allDates.add(d)
  const common = [...allDates].filter((d) => closeMaps.every((m) => m[d] != null)).sort()
  if (!common.length) return []

  const bases = closeMaps.map((m) => m[common[0]])
  const now = new Date().toISOString()
  return common.map((date) => {
    const avg = closeMaps.reduce((s, m, i) => s + (m[date] / bases[i] - 1), 0) / closeMaps.length
    return {
      symbol: 'CONTAINER-INDEX', date,
      open: null, high: null, low: null,
      close: +(100 * (1 + avg)).toFixed(4),
      source: 'synthetic',
      method: 'equal_weight_rebase_100',
      components: CONTAINER_COMPONENTS,
      updated_at: now,
    }
  })
}

async function upsert(table, rows) {
  const BATCH = 500
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await sb.from(table).upsert(rows.slice(i, i + BATCH), { onConflict: 'symbol,date' })
    if (error) throw new Error(`${table} upsert @${i}: ${error.message}`)
  }
}

// ── Main ──
async function main() {
  const now = new Date()
  const end = now.toISOString().split('T')[0]
  const start = new Date(now); start.setDate(start.getDate() - 90)
  const startDate = start.toISOString().split('T')[0]

  console.log(`Backfilling ${startDate} → ${end}\n`)

  const rawRows = []
  const errors = []

  // 1. CPA
  const batches = chunk(CPA_SYMBOLS, BATCH_SIZE)
  for (let i = 0; i < batches.length; i++) {
    try {
      console.log(`  CPA batch ${i + 1}/${batches.length}: ${batches[i].join(', ')}`)
      const rows = await fetchCPA(batches[i], startDate, end)
      rawRows.push(...rows)
      console.log(`    → ${rows.length} rows`)
    } catch (e) {
      errors.push(e.message)
      console.error(`    ✗ ${e.message}`)
    }
    if (i < batches.length - 1) await new Promise((r) => setTimeout(r, 1500))
  }

  // 2. Yahoo
  for (const ticker of YAHOO_SYMBOLS) {
    try {
      console.log(`  Yahoo: ${ticker}`)
      const rows = await fetchYahoo(ticker)
      rawRows.push(...rows)
      console.log(`    → ${rows.length} rows`)
    } catch (e) {
      errors.push(e.message)
      console.error(`    ✗ ${e.message}`)
    }
  }

  // 3. Computed
  const rowsBySymbol = {}
  for (const r of rawRows) {
    if (!rowsBySymbol[r.symbol]) rowsBySymbol[r.symbol] = []
    rowsBySymbol[r.symbol].push(r)
  }
  const computedRows = computeContainerIndex(rowsBySymbol)
  console.log(`  CONTAINER-INDEX: ${computedRows.length} rows`)

  // 4. Upsert
  console.log(`\nUpserting ${rawRows.length} raw + ${computedRows.length} computed rows...`)
  try {
    if (rawRows.length) await upsert('commodity_timeseries', rawRows)
    if (computedRows.length) await upsert('commodity_timeseries_computed', computedRows)
    console.log('✓ Done!')
  } catch (e) {
    console.error('✗ Upsert failed:', e.message)
    errors.push(e.message)
  }

  if (errors.length) console.log('\nErrors:', errors)
}

main().catch(console.error)
