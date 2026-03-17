import { ALL_SYMBOLS, CPA_SYMBOLS, YAHOO_SYMBOLS, SYNTHETIC_ENTRIES, chunk, CPA_BATCH_SIZE } from './_shared/config.js'
import {
  getSupabase,
  upsertTimeseries,
  upsertComputed,
  fetchCPALatest,
  fetchYahooChart,
  yahooChartToRows,
  computeContainerIndex,
} from './_shared/dataHelpers.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { symbols: symbolParam, days: daysParam, live } = req.query

  // Validate symbols
  const requestedSymbols = symbolParam
    ? symbolParam.split(',').map((s) => s.trim()).filter(Boolean)
    : ALL_SYMBOLS

  const invalid = requestedSymbols.filter((s) => !ALL_SYMBOLS.includes(s))
  if (invalid.length > 0) {
    return res.status(400).json({ status: 'error', message: `Unknown symbols: ${invalid.join(', ')}` })
  }

  const days = Math.min(Math.max(parseInt(daysParam || '90', 10), 1), 365)

  // ── Live mode: fetch latest prices, upsert, then return full timeseries ──
  if (live === 'true' || live === '1') {
    // Cooldown: skip external fetch if data was updated within the last 60 min
    const supabaseCooldown = getSupabase()
    const { data: recentRow } = await supabaseCooldown
      .from('commodity_timeseries')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    const lastUpdateTime = recentRow?.updated_at ? new Date(recentRow.updated_at).getTime() : 0
    const COOLDOWN_MS = 60 * 60 * 1000 // 60 minutes
    const skipLiveFetch = (Date.now() - lastUpdateTime) < COOLDOWN_MS

    if (!skipLiveFetch) try {
      const rows = []
      const computedRows = []

      // CPA latest — isolated so a CPA failure doesn't block Yahoo
      const cpaSymbols = requestedSymbols.filter((s) => CPA_SYMBOLS.includes(s))
      if (cpaSymbols.length > 0) {
        const batches = chunk(cpaSymbols, CPA_BATCH_SIZE)
        for (const batch of batches) {
          try {
            const batchRows = await fetchCPALatest(batch)
            rows.push(...batchRows)
          } catch (err) {
            console.error(`Live CPA batch [${batch.join(',')}]:`, err.message)
          }
        }
      }

      // Yahoo latest (use range=5d for quick fetch)
      const yahooSymbols = requestedSymbols.filter((s) => YAHOO_SYMBOLS.includes(s))
      for (const ticker of yahooSymbols) {
        try {
          const chart = await fetchYahooChart(ticker, '5d')
          const yahooRows = yahooChartToRows(ticker, chart)
          if (yahooRows.length > 0) {
            rows.push(yahooRows[yahooRows.length - 1]) // latest day only
          }
        } catch (err) {
          console.error(`Live Yahoo ${ticker}:`, err.message)
        }
      }

      // Recompute CONTAINER-INDEX if any synthetic is requested
      const syntheticRequested = requestedSymbols.filter((s) =>
        SYNTHETIC_ENTRIES.some((e) => e.symbol === s)
      )
      if (syntheticRequested.length > 0) {
        for (const entry of SYNTHETIC_ENTRIES) {
          if (!requestedSymbols.includes(entry.symbol)) continue
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
          for (const r of rows) {
            if (components.includes(r.symbol)) {
              if (!rowsBySymbol[r.symbol]) rowsBySymbol[r.symbol] = []
              if (!rowsBySymbol[r.symbol].some((x) => x.date === r.date)) {
                rowsBySymbol[r.symbol].push(r)
              }
            }
          }
          const indexRows = computeContainerIndex(rowsBySymbol, components, entry.synthetic.baseValue)
          if (indexRows.length > 0) {
            computedRows.push(indexRows[indexRows.length - 1])
          }
        }
      }

      // Upsert raw → commodity_timeseries, computed → commodity_timeseries_computed
      if (rows.length > 0) await upsertTimeseries(rows)
      if (computedRows.length > 0) await upsertComputed(computedRows)
    } catch (err) {
      console.error('Live refresh error:', err.message)
      // Fall through to serve whatever is in the DB
    }
  }

  // ── Read from Supabase ──
  const supabase = getSupabase()
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('commodity_timeseries_all')
    .select('symbol, date, open, high, low, close')
    .in('symbol', requestedSymbols)
    .gte('date', sinceStr)
    .order('date', { ascending: true })

  if (error) {
    return res.status(500).json({ status: 'error', message: error.message })
  }

  // Group by symbol
  const grouped = {}
  for (const row of data ?? []) {
    if (!grouped[row.symbol]) grouped[row.symbol] = []
    grouped[row.symbol].push({
      date: row.date,
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
    })
  }

  return res.status(200).json({ status: 'ok', data: grouped })
}
