import { createClient } from '@supabase/supabase-js'

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

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
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

  // Normal load: read from DB — no TTL check, no external call
  if (!forceRefresh) {
    const { data: rows } = await supabase
      .from('news_articles')
      .select('url, title, description, source_name, url_to_image, published_at, category')
      .order('published_at', { ascending: false })
    return res.status(200).json({
      status: 'ok',
      totalResults: (rows ?? []).length,
      articles: (rows ?? []).map(dbRowToArticle),
    })
  }

  // force=true: fetch from NewsAPI — all three category queries in parallel
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

    // Tag each article with its category before merging
    const allArticles = [
      ...(energyData.articles || []).map((a) => ({ ...a, category: 'energy' })),
      ...(foodData.articles || []).map((a) => ({ ...a, category: 'food' })),
      ...(shippingData.articles || []).map((a) => ({ ...a, category: 'shipping' })),
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

    return res.status(200).json({
      status: 'ok',
      totalResults: unique.length,
      articles: unique,
    })
  } catch (err) {
    console.error('NewsAPI proxy error:', err)

    // Fallback to whatever is in DB
    const { data: stale } = await supabase
      .from('news_articles')
      .select('url, title, description, source_name, url_to_image, published_at, category')
      .order('published_at', { ascending: false })

    if (stale?.length) {
      return res.status(200).json({
        status: 'ok',
        totalResults: stale.length,
        articles: stale.map(dbRowToArticle),
      })
    }

    return res.status(502).json({ status: 'error', message: 'Failed to reach NewsAPI' })
  }
}
