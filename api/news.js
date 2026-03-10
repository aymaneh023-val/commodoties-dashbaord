const SOURCES = 'reuters,associated-press,bbc-news,financial-times,al-jazeera-english,the-wall-street-journal,bloomberg'

const energyQuery =
  '"oil price" OR "Iran war" OR "Strait of Hormuz" OR ' +
  '"LNG Europe" OR "energy crisis" OR "gas prices Europe"'

const foodQuery =
  '"food supply chain" OR "food prices" OR ' +
  '"wheat prices" OR "fertilizer" OR ' +
  '"food inflation" OR "crop shortage" OR ' +
  '"agricultural supply" OR "food security" OR ' +
  '"soybean" OR "grain exports"'

const shippingQuery =
  '"container rates" OR "shipping disruption" OR ' +
  '"Red Sea" OR "freight costs" OR ' +
  '"supply chain disruption" OR "port congestion" OR ' +
  '"trade routes"'

function buildUrl(query, apiKey) {
  return (
    `https://newsapi.org/v2/everything?` +
    `sources=${SOURCES}&` +
    `q=${encodeURIComponent(query)}&` +
    `language=en&` +
    `sortBy=publishedAt&` +
    `pageSize=30&` +
    `apiKey=${apiKey}`
  )
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const apiKey = process.env.NEWS_API_KEY
  if (!apiKey) {
    return res.status(500).json({ status: 'error', message: 'NEWS_API_KEY not configured on server' })
  }

  try {
    const [energyRes, foodRes, shippingRes] = await Promise.all([
      fetch(buildUrl(energyQuery, apiKey), { headers: { 'User-Agent': 'EU-Energy-Monitor/1.0' } }),
      fetch(buildUrl(foodQuery, apiKey), { headers: { 'User-Agent': 'EU-Energy-Monitor/1.0' } }),
      fetch(buildUrl(shippingQuery, apiKey), { headers: { 'User-Agent': 'EU-Energy-Monitor/1.0' } }),
    ])

    const [energyData, foodData, shippingData] = await Promise.all([
      energyRes.json(),
      foodRes.json(),
      shippingRes.json(),
    ])

    // Merge all articles
    const allArticles = [
      ...(energyData.articles || []),
      ...(foodData.articles || []),
      ...(shippingData.articles || []),
    ]

    // Deduplicate by URL
    const seen = new Set()
    const unique = allArticles.filter((a) => {
      if (!a.url || seen.has(a.url)) return false
      seen.add(a.url)
      return true
    })

    // Sort by publishedAt descending
    unique.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))

    return res.status(200).json({
      status: 'ok',
      totalResults: unique.length,
      articles: unique,
    })
  } catch (err) {
    console.error('NewsAPI proxy error:', err)
    return res.status(502).json({ status: 'error', message: 'Failed to reach NewsAPI' })
  }
}
