const EUROSTAT_URL =
  'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_mmor?format=JSON&lang=EN&coicop=CP01&geo=EA&lastTimePeriod=24'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const r = await fetch(EUROSTAT_URL, {
      headers: { Accept: 'application/json', 'User-Agent': 'EU-Energy-Monitor/1.0' },
      signal: AbortSignal.timeout(15000),
    })
    if (!r.ok) throw new Error(`Eurostat: ${r.status}`)

    const json = await r.json()

    // Parse JSON-stat: value object keyed by position, time dimension has categories
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

    return res.status(200).json({ status: 'ok', data })
  } catch (err) {
    console.error('Eurostat proxy error:', err.message)
    return res.status(502).json({ status: 'error', message: err.message })
  }
}
