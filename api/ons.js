const ONS_URL =
  'https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/L55O/mm23/data'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const r = await fetch(ONS_URL, {
      headers: { 'User-Agent': 'EU-Energy-Monitor/1.0' },
      signal: AbortSignal.timeout(15000),
    })
    if (!r.ok) throw new Error(`ONS: ${r.status}`)

    const json = await r.json()

    // months array: each item has { date, value, year, month, ... }
    const months = json.months
    if (!Array.isArray(months) || months.length === 0) {
      throw new Error('ONS: no months data')
    }

    const last24 = months.slice(-24).map((m) => ({
      month: `${m.year}-${String(monthNameToNum(m.month)).padStart(2, '0')}`,
      value: parseFloat(m.value),
    }))

    return res.status(200).json({ status: 'ok', data: last24 })
  } catch (err) {
    console.error('ONS proxy error:', err.message)
    return res.status(502).json({ status: 'error', message: err.message })
  }
}

function monthNameToNum(name) {
  const months = {
    January: 1, February: 2, March: 3, April: 4,
    May: 5, June: 6, July: 7, August: 8,
    September: 9, October: 10, November: 11, December: 12,
  }
  return months[name] || 1
}
