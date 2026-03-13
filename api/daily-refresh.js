import { CPA_SYMBOLS, YAHOO_SYMBOLS, SYNTHETIC_ENTRIES, chunk, CPA_BATCH_SIZE } from './_shared/config.js'
import {
  getSupabase,
  upsertTimeseries,
  upsertComputed,
  fetchCPAHistorical,
  fetchYahooChart,
  yahooChartToRows,
  computeContainerIndex,
} from './_shared/dataHelpers.js'

/**
 * /api/daily-refresh — fetch yesterday's close for all 17 symbols.
 *
 * Called by the master cron (/api/cron) or manually.
 * Also writes backward-compat rows to the old `prices` table.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // Target date = yesterday
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const targetDate = yesterday.toISOString().split('T')[0]

  const allRows = []
  const errors = []

  // ── 1. CommodityPriceAPI historical for yesterday ──
  const cpaBatches = chunk(CPA_SYMBOLS, CPA_BATCH_SIZE)
  for (let i = 0; i < cpaBatches.length; i++) {
    try {
      const rows = await fetchCPAHistorical(cpaBatches[i], targetDate)
      allRows.push(...rows)
    } catch (err) {
      errors.push(`CPA batch ${i}: ${err.message}`)
      console.error(`Daily CPA batch ${i}:`, err.message)
    }
  }

  // ── 2. Yahoo Finance for shipping tickers ──
  for (const ticker of YAHOO_SYMBOLS) {
    try {
      const chart = await fetchYahooChart(ticker, '5d')
      const rows = yahooChartToRows(ticker, chart)
      // Pick the row closest to targetDate, or the latest available
      const targetRow = rows.find((r) => r.date === targetDate) ?? rows[rows.length - 1]
      if (targetRow) allRows.push(targetRow)
    } catch (err) {
      errors.push(`Yahoo ${ticker}: ${err.message}`)
      console.error(`Daily Yahoo ${ticker}:`, err.message)
    }
  }

  // ── 3. Compute CONTAINER-INDEX for the target date ──
  const computedRows = []
  for (const entry of SYNTHETIC_ENTRIES) {
    try {
      const supabase = getSupabase()
      const components = entry.synthetic.components
      const rowsBySymbol = {}
      for (const comp of components) {
        const { data } = await supabase
          .from('commodity_timeseries')
          .select('symbol, date, close')
          .eq('symbol', comp)
          .order('date', { ascending: true })
        rowsBySymbol[comp] = data ?? []
      }
      // Add today's fetched rows
      for (const r of allRows) {
        if (components.includes(r.symbol)) {
          if (!rowsBySymbol[r.symbol]) rowsBySymbol[r.symbol] = []
          if (!rowsBySymbol[r.symbol].some((x) => x.date === r.date)) {
            rowsBySymbol[r.symbol].push(r)
          }
        }
      }
      const indexRows = computeContainerIndex(rowsBySymbol, components, entry.synthetic.baseValue)
      // Only take the latest-date index row
      if (indexRows.length > 0) {
        computedRows.push(indexRows[indexRows.length - 1])
      }
    } catch (err) {
      errors.push(`Synthetic ${entry.symbol}: ${err.message}`)
      console.error(`Daily synthetic ${entry.symbol}:`, err.message)
    }
  }

  // ── 4. Upsert raw → commodity_timeseries, computed → commodity_timeseries_computed ──
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
    console.error('Daily upsert error:', err.message)
  }

  // ── 5. Backward compat: update old `prices` table ──
  try {
    const supabase = getSupabase()
    const allUpserted = [...allRows, ...computedRows]
    for (const row of allUpserted) {
      if (row.close == null) continue
      // Compute 30-day change%
      const thirtyAgo = new Date(yesterday)
      thirtyAgo.setDate(thirtyAgo.getDate() - 30)
      const { data: oldRow } = await supabase
        .from('commodity_timeseries')
        .select('close')
        .eq('symbol', row.symbol)
        .lte('date', thirtyAgo.toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle()

      const changePct = oldRow?.close
        ? parseFloat((((row.close - oldRow.close) / oldRow.close) * 100).toFixed(4))
        : null

      await supabase.from('prices').insert({
        ticker: row.symbol,
        price: row.close,
        change_pct: changePct,
      })
    }
  } catch (err) {
    // Non-critical — log but don't fail
    console.error('Backward compat prices write:', err.message)
  }

  return res.status(errors.length > 0 && upserted === 0 ? 502 : 200).json({
    status: errors.length === 0 ? 'ok' : 'partial',
    targetDate,
    rowsUpserted: upserted,
    errors: errors.length > 0 ? errors : undefined,
  })
}
