const BLS_URL = 'https://api.bls.gov/publicAPI/v1/timeseries/data/'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

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

    // BLS returns newest first; each item: { year, period, periodName, value }
    // period is "M01"–"M12", skip "M13" (annual avg)
    const monthly = series
      .filter((d) => d.period !== 'M13' && d.value !== '-')
      .map((d) => ({
        month: `${d.year}-${d.period.replace('M', '')}`,
        value: parseFloat(d.value),
        periodName: d.periodName,
      }))
      .reverse() // oldest first

    const last24 = monthly.slice(-24)

    return res.status(200).json({ status: 'ok', data: last24 })
  } catch (err) {
    console.error('BLS proxy error:', err.message)
    return res.status(502).json({ status: 'error', message: err.message })
  }
}
