import { createClient } from '@supabase/supabase-js'

// The 6 major EU economies tracked individually.
// Source keys in inflation_cache are lowercase geo codes.
const COUNTRIES = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE']
const BASE_URL =
  'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_manr' +
  '?format=JSON&lang=EN&coicop=CP01&lastTimePeriod=36&geo='

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
}

async function fetchCountry(geo) {
  const r = await fetch(`${BASE_URL}${geo}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'EU-Energy-Monitor/1.0' },
    signal: AbortSignal.timeout(15000),
  })
  if (!r.ok) throw new Error(`Eurostat ${geo}: ${r.status}`)
  const json = await r.json()

  const timeIndex = json.dimension?.time?.category?.index ?? {}
  const values = json.value ?? {}
  const periods = Object.entries(timeIndex).sort((a, b) => a[1] - b[1])

  return periods
    .map(([period, idx]) => {
      const v = values[String(idx)]
      return v != null ? { month: period, value: parseFloat(Number(v).toFixed(2)) } : null
    })
    .filter(Boolean)
    .slice(-24)
}

function buildCountriesMap(rows) {
  const out = {}
  for (const c of COUNTRIES) {
    out[c.toLowerCase()] = (rows ?? [])
      .filter((r) => r.source === c.toLowerCase())
      .map((r) => ({ month: r.month, value: r.value }))
  }
  return out
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const forceRefresh = req.query.force === 'true' || req.query.force === '1'
  const supabase = getSupabase()
  const sources = COUNTRIES.map((c) => c.toLowerCase())

  // Normal load: read from DB
  if (!forceRefresh) {
    const { data } = await supabase
      .from('inflation_cache')
      .select('source, month, value')
      .in('source', sources)
      .order('month', { ascending: true })
    return res.status(200).json({ status: 'ok', countries: buildCountriesMap(data) })
  }

  // force=true: fetch all 6 from Eurostat in parallel
  try {
    const results = await Promise.allSettled(COUNTRIES.map((geo) => fetchCountry(geo)))

    const now = new Date().toISOString()
    const rows = []
    const errors = []

    for (let i = 0; i < COUNTRIES.length; i++) {
      const result = results[i]
      const geo = COUNTRIES[i].toLowerCase()
      if (result.status === 'fulfilled') {
        rows.push(
          ...result.value.map((d) => ({ source: geo, month: d.month, value: d.value, fetched_at: now }))
        )
      } else {
        errors.push(`${COUNTRIES[i]}: ${result.reason?.message}`)
        console.error(`Eurostat country fetch failed for ${COUNTRIES[i]}:`, result.reason?.message)
      }
    }

    if (rows.length > 0) {
      await supabase.from('inflation_cache').upsert(rows, { onConflict: 'source,month' })
    }

    const { data } = await supabase
      .from('inflation_cache')
      .select('source, month, value')
      .in('source', sources)
      .order('month', { ascending: true })

    const response = { status: 'ok', countries: buildCountriesMap(data) }
    if (errors.length) response.warnings = errors
    if (errors.length === COUNTRIES.length) return res.status(502).json({ status: 'error', message: errors.join('; ') })
    return res.status(200).json(response)
  } catch (err) {
    console.error('Eurostat countries error:', err.message)
    // Fallback to DB
    const { data } = await supabase
      .from('inflation_cache')
      .select('source, month, value')
      .in('source', sources)
      .order('month', { ascending: true })
    if (data?.length) return res.status(200).json({ status: 'ok', countries: buildCountriesMap(data) })
    return res.status(502).json({ status: 'error', message: err.message })
  }
}
