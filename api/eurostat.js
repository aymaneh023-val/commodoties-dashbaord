const EUROSTAT_BASE =
  'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_mmor'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const headlineURL = `${EUROSTAT_BASE}?geo=EA&coicop=CP00&lastTimePeriods=13`
    const foodURL = `${EUROSTAT_BASE}?geo=EA&coicop=CP01&lastTimePeriods=13`

    const [headlineRes, foodRes] = await Promise.all([
      fetch(headlineURL, {
        headers: { Accept: 'application/json', 'User-Agent': 'EU-Energy-Monitor/1.0' },
        signal: AbortSignal.timeout(15000),
      }),
      fetch(foodURL, {
        headers: { Accept: 'application/json', 'User-Agent': 'EU-Energy-Monitor/1.0' },
        signal: AbortSignal.timeout(15000),
      }),
    ])

    if (!headlineRes.ok) throw new Error(`Eurostat headline: ${headlineRes.status}`)
    if (!foodRes.ok) throw new Error(`Eurostat food: ${foodRes.status}`)

    const headlineJson = await headlineRes.json()
    const foodJson = await foodRes.json()

    return res.status(200).json({
      status: 'ok',
      headline: headlineJson,
      food: foodJson,
    })
  } catch (err) {
    console.error('Eurostat proxy error:', err.message)
    return res.status(502).json({ status: 'error', message: err.message })
  }
}
