import { createClient } from '@supabase/supabase-js'

// D7BU = "CPI INDEX 01 : FOOD AND NON-ALCOHOLIC BEVERAGES 2015=100"
// (previously L55O which was all-items CPIH annual rate — wrong series and wrong unit)
const ONS_URL =
  'https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/D7BU/mm23/data'

const CACHE_KEY = 'ons'
const CACHE_TTL_MS = 12 * 60 * 60 * 1000 // 12 hours

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const forceRefresh = req.query.force === 'true' || req.query.force === '1'
  const supabase = getSupabase()

  // 1. Check cache_meta
  if (!forceRefresh) {
    const { data: meta } = await supabase
      .from('cache_meta')
      .select('fetched_at')
      .eq('key', CACHE_KEY)
      .single()

    if (meta && Date.now() - new Date(meta.fetched_at).getTime() < CACHE_TTL_MS) {
      const { data: cached } = await supabase
        .from('inflation_cache')
        .select('month, value')
        .eq('source', CACHE_KEY)
        .order('month', { ascending: true })

      if (cached?.length) {
        return res.status(200).json({ status: 'ok', data: cached, fromCache: true })
      }
    }
  }

  // 2. Fetch from ONS
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

    // 3. Upsert into inflation_cache (updates value + fetched_at on conflict)
    const now = new Date().toISOString()
    await supabase.from('inflation_cache').upsert(
      last24.map((d) => ({ source: CACHE_KEY, month: d.month, value: d.value, fetched_at: now })),
      { onConflict: 'source,month' }
    )

    // 4. Update cache_meta
    await supabase
      .from('cache_meta')
      .upsert({ key: CACHE_KEY, fetched_at: now }, { onConflict: 'key' })

    return res.status(200).json({ status: 'ok', data: last24 })
  } catch (err) {
    console.error('ONS proxy error:', err.message)

    // Stale fallback
    const { data: stale } = await supabase
      .from('inflation_cache')
      .select('month, value')
      .eq('source', CACHE_KEY)
      .order('month', { ascending: true })

    if (stale?.length) {
      return res.status(200).json({ status: 'ok', data: stale, fromCache: true, stale: true })
    }

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
