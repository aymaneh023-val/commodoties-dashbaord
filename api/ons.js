import { createClient } from '@supabase/supabase-js'

// D7BU = "CPI INDEX 01 : FOOD AND NON-ALCOHOLIC BEVERAGES 2015=100"
const ONS_URL =
  'https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/D7BU/mm23/data'

const SOURCE = 'ons'

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const forceRefresh = req.query.force === 'true' || req.query.force === '1'
  const supabase = getSupabase()

  // Normal load: read from DB — no TTL check, no external call
  if (!forceRefresh) {
    const { data } = await supabase
      .from('inflation_cache')
      .select('month, value')
      .eq('source', SOURCE)
      .order('month', { ascending: true })
    return res.status(200).json({ status: 'ok', data: data ?? [] })
  }

  // force=true: fetch from ONS and update DB
  try {
    const r = await fetch(ONS_URL, {
      headers: { 'User-Agent': 'EU-Energy-Monitor/1.0' },
      signal: AbortSignal.timeout(15000),
    })
    if (!r.ok) throw new Error(`ONS: ${r.status}`)

    const json = await r.json()

    const months = json.months
    if (!Array.isArray(months) || months.length === 0) {
      throw new Error('ONS: no months data')
    }

    // Parse full series oldest-first, then compute YoY % from each month vs
    // the same month one year prior. We need 13+ months of raw data to produce
    // YoY values, so we operate over all months before slicing to last 24.
    const allMonths = months
      .map((m) => ({
        month: `${m.year}-${String(monthNameToNum(m.month)).padStart(2, '0')}`,
        value: parseFloat(m.value),
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    const last24 = computeYoY(allMonths).slice(-24)

    // Guard: food YoY % is always > 0.8 in absolute terms in the post-2020 era.
    // MoM values cluster around 0.0–0.5. If the median absolute value is below
    // this threshold we almost certainly have MoM data in a YoY column — abort.
    const sorted = [...last24].sort((a, b) => Math.abs(a.value) - Math.abs(b.value))
    const medianAbs = Math.abs(sorted[Math.floor(sorted.length / 2)]?.value ?? 0)
    if (medianAbs < 0.8) {
      throw new Error(
        `ONS YoY sanity check failed: median |value| = ${medianAbs.toFixed(2)}% — looks like MoM data, aborting upsert`
      )
    }

    const now = new Date().toISOString()
    await supabase.from('inflation_cache').upsert(
      last24.map((d) => ({ source: SOURCE, month: d.month, value: d.value, fetched_at: now })),
      { onConflict: 'source,month' }
    )

    return res.status(200).json({ status: 'ok', data: last24 })
  } catch (err) {
    console.error('ONS proxy error:', err.message)

    // Fallback to whatever is in DB
    const { data: stale } = await supabase
      .from('inflation_cache')
      .select('month, value')
      .eq('source', SOURCE)
      .order('month', { ascending: true })

    if (stale?.length) return res.status(200).json({ status: 'ok', data: stale })
    return res.status(502).json({ status: 'error', message: err.message })
  }
}

// Compute year-over-year % change by comparing each month against the same
// month 12 months earlier. Months with no year-ago value are skipped.
function computeYoY(series) {
  const byMonth = {}
  for (const d of series) byMonth[d.month] = d.value
  const result = []
  for (const d of series) {
    const [y, m] = d.month.split('-').map(Number)
    const prevKey = `${y - 1}-${String(m).padStart(2, '0')}`
    const prevVal = byMonth[prevKey]
    if (prevVal == null) continue
    result.push({
      month: d.month,
      value: parseFloat((((d.value - prevVal) / prevVal) * 100).toFixed(2)),
    })
  }
  return result.sort((a, b) => a.month.localeCompare(b.month))
}

function monthNameToNum(name) {
  const months = {
    January: 1, February: 2, March: 3, April: 4,
    May: 5, June: 6, July: 7, August: 8,
    September: 9, October: 10, November: 11, December: 12,
  }
  return months[name] || 1
}
