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

    // Parse full series oldest-first, then compute MoM % from consecutive pairs.
    // We need n+1 raw values to produce n MoM % values, so we operate over
    // all months before slicing to last 24.
    const allMonths = months
      .map((m) => ({
        month: `${m.year}-${String(monthNameToNum(m.month)).padStart(2, '0')}`,
        value: parseFloat(m.value),
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    const last24 = computeMoM(allMonths).slice(-24)

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

// Compute month-on-month % change from consecutive index pairs.
// Skips any pair where the calendar gap is not exactly 1 month.
function computeMoM(series) {
  const result = []
  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1], curr = series[i]
    const [py, pm] = prev.month.split('-').map(Number)
    const [cy, cm] = curr.month.split('-').map(Number)
    if ((cy - py) * 12 + (cm - pm) !== 1) continue
    result.push({
      month: curr.month,
      value: parseFloat((((curr.value - prev.value) / prev.value) * 100).toFixed(2)),
    })
  }
  return result
}

function monthNameToNum(name) {
  const months = {
    January: 1, February: 2, March: 3, April: 4,
    May: 5, June: 6, July: 7, August: 8,
    September: 9, October: 10, November: 11, December: 12,
  }
  return months[name] || 1
}
