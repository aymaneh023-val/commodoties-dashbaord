import { CPA_SYMBOLS, YAHOO_SYMBOLS, SYNTHETIC_ENTRIES, chunk, CPA_BATCH_SIZE } from './_shared/config.js'
import {
  upsertTimeseries,
  upsertComputed,
  fetchCPATimeseries,
  fetchYahooChart,
  yahooChartToRows,
  computeContainerIndex,
} from './_shared/dataHelpers.js'

/**
 * /api/backfill — one-time job to seed 90 days of history.
 *
 * Call manually: GET /api/backfill?secret=YOUR_SECRET
 * Protected by BACKFILL_SECRET env var.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // Auth check
  const secret = process.env.BACKFILL_SECRET
  if (secret && req.query.secret !== secret) {
    return res.status(403).json({ status: 'error', message: 'Invalid secret' })
  }

  const now = new Date()
  const endDate = now.toISOString().split('T')[0]
  const start = new Date(now)
  start.setDate(start.getDate() - 90)
  const startDate = start.toISOString().split('T')[0]

  const allRows = []
  const computedRows = []
  const errors = []

  // ── 1. CommodityPriceAPI timeseries (12 symbols, batched) ──
  const cpaBatches = chunk(CPA_SYMBOLS, CPA_BATCH_SIZE)
  for (let i = 0; i < cpaBatches.length; i++) {
    try {
      const rows = await fetchCPATimeseries(cpaBatches[i], startDate, endDate)
      allRows.push(...rows)
    } catch (err) {
      errors.push(`CPA batch ${i}: ${err.message}`)
      console.error(`Backfill CPA batch ${i}:`, err.message)
    }
    // Small delay between batches to respect trial rate limit
    if (i < cpaBatches.length - 1) {
      await new Promise((r) => setTimeout(r, 1500))
    }
  }

  // ── 2. Yahoo Finance history (4 shipping tickers, 3-month range) ──
  for (const ticker of YAHOO_SYMBOLS) {
    try {
      const chart = await fetchYahooChart(ticker, '3mo')
      allRows.push(...yahooChartToRows(ticker, chart))
    } catch (err) {
      errors.push(`Yahoo ${ticker}: ${err.message}`)
      console.error(`Backfill Yahoo ${ticker}:`, err.message)
    }
  }

  // ── 3. Compute CONTAINER-INDEX from Yahoo component data ──
  for (const entry of SYNTHETIC_ENTRIES) {
    const components = entry.synthetic.components
    const rowsBySymbol = {}
    for (const sym of components) {
      rowsBySymbol[sym] = allRows.filter((r) => r.symbol === sym)
    }
    const indexRows = computeContainerIndex(rowsBySymbol, components, entry.synthetic.baseValue)
    computedRows.push(...indexRows)
  }

  // ── 4. Bulk upsert — raw + computed to separate tables ──
  let upserted = 0
  try {
    if (allRows.length > 0) {
      await upsertTimeseries(allRows)
      upserted += allRows.length
    }
    if (computedRows.length > 0) {
      await upsertComputed(computedRows)
      upserted += computedRows.length
    }
  } catch (err) {
    errors.push(`Upsert: ${err.message}`)
    console.error('Backfill upsert error:', err.message)
  }

  return res.status(errors.length > 0 && upserted === 0 ? 502 : 200).json({
    status: errors.length === 0 ? 'ok' : 'partial',
    rowsUpserted: upserted,
    startDate,
    endDate,
    errors: errors.length > 0 ? errors : undefined,
  })
}
