import { createClient } from '@supabase/supabase-js'

const BLS_URL = 'https://api.bls.gov/publicAPI/v1/timeseries/data/'

const CACHE_KEY = 'bls'
const CACHE_TTL_MS = 12 * 60 * 60 * 1000 // 12 hours

// Compute month-on-month % change from consecutive index pairs.
// Skips any pair where the calendar gap is not exactly 1 month (handles BLS data gaps).
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

  // 2. Fetch from BLS
  try {
    const r = await fetch(BLS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EU-Energy-Monitor/1.0',
      },
      body: JSON.stringify({ seriesid: ['CUUR0000SAF1'] }),
      signal: AbortSignal.timeout(15000),
    })
    if (!r.ok) {
      const body = await r.text().catch(() => '(unreadable)')
      console.error('BLS HTTP error', r.status, body.substring(0, 300))
      throw new Error(`BLS: ${r.status}`)
    }

    const json = await r.json()

    if (json.status !== 'REQUEST_SUCCEEDED') {
      throw new Error(`BLS status: ${json.status}`)
    }

    const series = json.Results?.series?.[0]?.data
    if (!Array.isArray(series) || series.length === 0) {
      throw new Error('BLS: no series data')
    }

    // BLS returns newest first; period is "M01"–"M12", skip "M13" (annual avg)
    const monthly = series
      .filter((d) => d.period !== 'M13' && d.value !== '-')
      .map((d) => ({
        month: `${d.year}-${d.period.replace('M', '')}`,
        value: parseFloat(d.value),
      }))
      .reverse() // oldest first

    // Compute MoM % over the full series before slicing so the boundary month
    // always has a valid predecessor. Gaps (e.g. Oct 2025 is missing from BLS)
    // are automatically dropped by the consecutive-month check.
    const last24 = computeMoM(monthly).slice(-24)

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
    console.error('BLS proxy error:', err.message)

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
