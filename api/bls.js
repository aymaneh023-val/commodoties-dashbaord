import { createClient } from '@supabase/supabase-js'

const BLS_URL = 'https://api.bls.gov/publicAPI/v1/timeseries/data/'

const SOURCE = 'bls'

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

    // Compute YoY % over the full series before slicing so the boundary month
    // always has a valid predecessor. Gaps (e.g. Oct 2025 is missing from BLS)
    // are automatically dropped by the consecutive-month check.
    const last24 = computeYoY(monthly).slice(-24)

    // Guard: food YoY % is always > 0.8 in absolute terms in the post-2020 era.
    // MoM values cluster around 0.0–0.5. If the median absolute value is below
    // this threshold we almost certainly have MoM data in a YoY column — abort.
    const sorted = [...last24].sort((a, b) => Math.abs(a.value) - Math.abs(b.value))
    const medianAbs = Math.abs(sorted[Math.floor(sorted.length / 2)]?.value ?? 0)
    if (medianAbs < 0.8) {
      throw new Error(
        `BLS YoY sanity check failed: median |value| = ${medianAbs.toFixed(2)}% — looks like MoM data, aborting upsert`
      )
    }

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
