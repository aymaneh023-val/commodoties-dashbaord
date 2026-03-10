const SOURCES = 'reuters,associated-press,bbc-news,financial-times,al-jazeera-english'

const DEFAULT_QUERY =
  '"oil" OR "gas" OR "Iran" OR "energy" OR "food prices" OR "LNG" OR ' +
  '"shipping" OR "fertilizer" OR "Strait of Hormuz" OR "supply chain"'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const apiKey = process.env.NEWS_API_KEY
  if (!apiKey) {
    return res.status(500).json({ status: 'error', message: 'NEWS_API_KEY not configured on server' })
  }

  const clientParams = new URL(req.url, 'http://localhost').searchParams
  const query = clientParams.get('q') || DEFAULT_QUERY

  const url =
    `https://newsapi.org/v2/everything?` +
    `sources=${SOURCES}&` +
    `q=${encodeURIComponent(query)}&` +
    `language=en&` +
    `sortBy=publishedAt&` +
    `pageSize=10&` +
    `apiKey=${apiKey}`

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'EU-Energy-Monitor/1.0' },
    })
    const data = await upstream.json()
    return res.status(upstream.status).json(data)
  } catch (err) {
    console.error('NewsAPI proxy error:', err)
    return res.status(502).json({ status: 'error', message: 'Failed to reach NewsAPI' })
  }
}
