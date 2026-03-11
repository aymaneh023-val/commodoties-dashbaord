import { createClient } from '@supabase/supabase-js'

const EUROSTAT_URL =
  'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_mmor?format=JSON&lang=EN&coicop=CP01&geo=EA&lastTimePeriod=24'

const CACHE_KEY = 'eurostat'
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

  // 2. Fetch from Eurostat
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

    // 3. Upsert into inflation_cache (updates value + fetched_at on conflict)
    const now = new Date().toISOString()
    await supabase.from('inflation_cache').upsert(
      data.map((d) => ({ source: CACHE_KEY, month: d.month, value: d.value, fetched_at: now })),
      { onConflict: 'source,month' }
    )

    // 4. Update cache_meta
    await supabase
      .from('cache_meta')
      .upsert({ key: CACHE_KEY, fetched_at: now }, { onConflict: 'key' })

    return res.status(200).json({ status: 'ok', data })
  } catch (err) {
    console.error('Eurostat proxy error:', err.message)

    // Stale fallback — return whatever is in DB rather than a hard 502
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
