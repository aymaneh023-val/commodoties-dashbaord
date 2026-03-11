import { createClient } from '@supabase/supabase-js'

const BLS_URL = 'https://api.bls.gov/publicAPI/v1/timeseries/data/'

const SOURCE = 'bls'

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

  // Normal load: read from DB — no TTL check, no external call
  if (!forceRefresh) {
    const { data } = await supabase
      .from('inflation_cache')
      .select('month, value')
      .eq('source', SOURCE)
      .order('month', { ascending: true })
    return res.status(200).json({ status: 'ok', data: data ?? [] })
  }

  // force=true: fetch from BLS and update DB
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

    const now = new Date().toISOString()
    await supabase.from('inflation_cache').upsert(
      last24.map((d) => ({ source: SOURCE, month: d.month, value: d.value, fetched_at: now })),
      { onConflict: 'source,month' }
    )

    return res.status(200).json({ status: 'ok', data: last24 })
  } catch (err) {
    console.error('BLS proxy error:', err.message)

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
