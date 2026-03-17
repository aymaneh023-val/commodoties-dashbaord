import { createClient } from '@supabase/supabase-js'

const SOURCES = 'reuters,associated-press,bbc-news,financial-times,al-jazeera-english,the-wall-street-journal,bloomberg,the-economist,cnbc,euronews,politico'

const energyQuery =
  '"Brent crude" OR "oil prices" OR "crude oil" OR ' +
  '"TTF gas" OR "natural gas prices" OR "LNG prices" OR ' +
  '"energy prices Europe" OR "gas supply Europe" OR "oil sanctions"'

const foodQuery =
  '"wheat prices" OR "grain prices" OR "corn prices" OR ' +
  '"soybean prices" OR "palm oil" OR "fertilizer prices" OR ' +
  '"food inflation" OR "crop shortage" OR "grain exports" OR ' +
  '"butter prices" OR "dairy prices" OR "urea prices"'

const shippingQuery =
  '"container freight" OR "container rates" OR "shipping rates" OR ' +
  '"Red Sea shipping" OR "Maersk" OR "Hapag-Lloyd" OR ' +
  '"Baltic Dry Index" OR "freight rates" OR "port congestion"'

const macroQuery =
  '"food inflation" OR "consumer prices Europe" OR "cost of living" OR ' +
  '"supply chain costs" OR "producer price index" OR ' +
  '"ECB interest rate" OR "inflation outlook" OR "HICP" OR "purchasing power"'

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
}

async function pruneOldArticles(supabase) {
  const cutoff = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  await supabase.from('news_articles').delete().lt('published_at', cutoff)
}

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

// Map a DB row back to the NewsAPI article shape the frontend expects
function dbRowToArticle(row) {
  return {
    url: row.url,
    title: row.title,
    description: row.description,
    source: { name: row.source_name },
    urlToImage: row.url_to_image,
    publishedAt: row.published_at,
    category: row.category,
  }
}

// Map a NewsAPI article + category tag to a DB row
function articleToDbRow(article, category) {
  return {
    url: article.url,
    title: article.title,
    description: article.description ?? null,
    source_name: article.source?.name ?? null,
    url_to_image: article.urlToImage ?? null,
    published_at: article.publishedAt ?? null,
    category,
    fetched_at: new Date().toISOString(),
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const apiKey = process.env.NEWS_API_KEY
  if (!apiKey) {
    return res.status(500).json({ status: 'error', message: 'NEWS_API_KEY not configured on server' })
  }

  const forceRefresh = req.query.force === 'true' || req.query.force === '1'
  const supabase = getSupabase()

  const readFromDb = async () => {
    const cutoff = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    const { data: rows } = await supabase
      .from('news_articles')
      .select('url, title, description, source_name, url_to_image, published_at, category')
      .gte('published_at', cutoff)
      .order('published_at', { ascending: false })
    return rows ?? []
  }

  // Normal load: read from DB — no TTL check, no external call
  if (!forceRefresh) {
    const rows = await readFromDb()
    return res.status(200).json({
      status: 'ok',
      totalResults: rows.length,
      articles: rows.map(dbRowToArticle),
    })
  }

  // force=true: prune old articles, then fetch from NewsAPI — all four category queries in parallel
  try {
    await pruneOldArticles(supabase)

    const [energyRes, foodRes, shippingRes, macroRes] = await Promise.all([
      fetch(buildUrl(energyQuery, apiKey), { headers: { 'User-Agent': 'EU-Energy-Monitor/1.0' } }),
      fetch(buildUrl(foodQuery, apiKey), { headers: { 'User-Agent': 'EU-Energy-Monitor/1.0' } }),
      fetch(buildUrl(shippingQuery, apiKey), { headers: { 'User-Agent': 'EU-Energy-Monitor/1.0' } }),
      fetch(buildUrl(macroQuery, apiKey), { headers: { 'User-Agent': 'EU-Energy-Monitor/1.0' } }),
    ])

    const [energyData, foodData, shippingData, macroData] = await Promise.all([
      energyRes.json(),
      foodRes.json(),
      shippingRes.json(),
      macroRes.json(),
    ])

    // Tag each article with its category before merging
    const allArticles = [
      ...(energyData.articles || []).map((a) => ({ ...a, category: 'energy' })),
      ...(foodData.articles || []).map((a) => ({ ...a, category: 'food' })),
      ...(shippingData.articles || []).map((a) => ({ ...a, category: 'shipping' })),
      ...(macroData.articles || []).map((a) => ({ ...a, category: 'macro' })),
    ]

    // Deduplicate by URL (first category tag wins, matching DB DO NOTHING semantics)
    const seen = new Set()
    const unique = allArticles.filter((a) => {
      if (!a.url || seen.has(a.url)) return false
      seen.add(a.url)
      return true
    })

    unique.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))

    // Upsert into news_articles — DO NOTHING on url conflict preserves original category
    await supabase
      .from('news_articles')
      .upsert(
        unique.map((a) => articleToDbRow(a, a.category)),
        { onConflict: 'url', ignoreDuplicates: true }
      )

    const rows = await readFromDb()
    return res.status(200).json({
      status: 'ok',
      totalResults: rows.length,
      articles: rows.map(dbRowToArticle),
    })
  } catch (err) {
    console.error('NewsAPI proxy error:', err)

    // Fallback to whatever is in DB
    const stale = await readFromDb()

    if (stale.length) {
      return res.status(200).json({
        status: 'ok',
        totalResults: stale.length,
        articles: stale.map(dbRowToArticle),
      })
    }

    return res.status(502).json({ status: 'error', message: 'Failed to reach NewsAPI' })
  }
}
