const IMF_PFERT_URL =
  'https://imfstatapi.imf.org/v1/data/PCPS/M.W00.PFERT.IX?lastNObservations=13'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const r = await fetch(IMF_PFERT_URL, {
      headers: { Accept: 'application/json', 'User-Agent': 'EU-Energy-Monitor/1.0' },
      signal: AbortSignal.timeout(15000),
    })
    if (!r.ok) throw new Error(`IMF PFERT: ${r.status}`)

    const json = await r.json()

    return res.status(200).json({
      status: 'ok',
      data: json,
    })
  } catch (err) {
    console.error('IMF proxy error:', err.message)
    return res.status(502).json({ status: 'error', message: err.message })
  }
}
