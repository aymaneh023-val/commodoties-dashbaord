import { createClient } from '@supabase/supabase-js'

const EUROSTAT_URL =
  'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_manr?format=JSON&lang=EN&coicop=CP01&geo=EA&lastTimePeriod=24'

const SOURCE = 'eurostat'

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

  // force=true: fetch from Eurostat and update DB
  try {
    const r = await fetch(EUROSTAT_URL, {
      headers: { Accept: 'application/json', 'User-Agent': 'EU-Energy-Monitor/1.0' },
      signal: AbortSignal.timeout(15000),
    })
    if (!r.ok) throw new Error(`Eurostat: ${r.status}`)

    const json = await r.json()

    const timeDim = json.dimension?.time?.category
    const timeIndex = timeDim?.index ?? {}
    const values = json.value ?? {}

    const periods = Object.entries(timeIndex).sort((a, b) => a[1] - b[1])
    const data = periods
      .map(([period, idx]) => {
        const v = values[String(idx)]
        return v != null ? { month: period, value: parseFloat(Number(v).toFixed(2)) } : null
      })
      .filter(Boolean)

    const now = new Date().toISOString()
    await supabase.from('inflation_cache').upsert(
      data.map((d) => ({ source: SOURCE, month: d.month, value: d.value, fetched_at: now })),
      { onConflict: 'source,month' }
    )

    return res.status(200).json({ status: 'ok', data })
  } catch (err) {
    console.error('Eurostat proxy error:', err.message)

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
