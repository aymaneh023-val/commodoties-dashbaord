export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const apiKey = process.env.NEWS_API_KEY
  if (!apiKey) {
    return res.status(500).json({ status: 'error', message: 'NEWS_API_KEY not configured on server' })
  }

  // Forward all query params from the client, then inject the key
  const qs = req.url.includes('?') ? req.url.split('?')[1] : ''
  const params = new URLSearchParams(qs)
  params.set('apiKey', apiKey)

  try {
    const upstream = await fetch(`https://newsapi.org/v2/everything?${params}`, {
      headers: { 'User-Agent': 'EU-Energy-Monitor/1.0' },
    })
    const data = await upstream.json()
    return res.status(upstream.status).json(data)
  } catch (err) {
    console.error('NewsAPI proxy error:', err)
    return res.status(502).json({ status: 'error', message: 'Failed to reach NewsAPI' })
  }
}
