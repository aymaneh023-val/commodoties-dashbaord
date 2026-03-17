import { createClient } from '@supabase/supabase-js'

const SOURCES = 'reuters,associated-press,bbc-news,financial-times,al-jazeera-english,the-wall-street-journal,bloomberg,the-economist,cnbc,euronews,politico'

const energyQuery =
  '"Brent crude price" OR "oil price" OR "OPEC output" OR "OPEC production cut" OR ' +
  '"TTF gas" OR "European gas storage" OR "LNG terminal" OR "LNG cargo" OR ' +
  '"Strait of Hormuz" OR "oil supply disruption" OR "refinery shutdown" OR ' +
  '"crude oil futures" OR "gas pipeline Europe" OR "gasoil price"'

const foodQuery =
  '"wheat futures" OR "grain market" OR "corn futures" OR ' +
  '"soybean market" OR "palm oil price" OR "fertilizer market" OR ' +
  '"FAO food price index" OR "crop yield forecast" OR "grain export" OR ' +
  '"butter market" OR "dairy commodity" OR "urea price"'

const shippingQuery =
  '"container freight rate" OR "container shipping" OR ' +
  '"Red Sea shipping" OR "Suez Canal" OR ' +
  '"Maersk" OR "Hapag-Lloyd" OR "COSCO shipping" OR ' +
  '"Baltic Dry Index" OR "dry bulk freight"'

const macroQuery =
  '"eurozone inflation" OR "euro area CPI" OR "ECB rate decision" OR ' +
  '"food inflation Europe" OR "producer prices eurozone" OR ' +
  '"HICP" OR "eurozone GDP" OR "ECB monetary policy"'

const metalsQuery =
  '"gold price" OR "gold rally" OR "aluminium LME" OR ' +
  '"aluminium price" OR "base metals market" OR "gold futures"'

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
    `pageSize=15&` +
    `apiKey=${apiKey}`
  )
}

const OFFTOPIC_RE = /\b(oscar|grammy|emmy|bitcoin|crypto|nfl|nba|mlb|tennis|motogp|formula.?1|celebrity|kardashian|netflix|spotify|tiktok|instagram|fashion week)\b/i

function isRelevant(article) {
  const title = article.title || ''
  return !OFFTOPIC_RE.test(title)
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

    const [energyRes, foodRes, shippingRes, macroRes, metalsRes] = await Promise.all([
      fetch(buildUrl(energyQuery, apiKey), { headers: { 'User-Agent': 'EU-Energy-Monitor/1.0' } }),
      fetch(buildUrl(foodQuery, apiKey), { headers: { 'User-Agent': 'EU-Energy-Monitor/1.0' } }),
      fetch(buildUrl(shippingQuery, apiKey), { headers: { 'User-Agent': 'EU-Energy-Monitor/1.0' } }),
      fetch(buildUrl(macroQuery, apiKey), { headers: { 'User-Agent': 'EU-Energy-Monitor/1.0' } }),
      fetch(buildUrl(metalsQuery, apiKey), { headers: { 'User-Agent': 'EU-Energy-Monitor/1.0' } }),
    ])

    const [energyData, foodData, shippingData, macroData, metalsData] = await Promise.all([
      energyRes.json(),
      foodRes.json(),
      shippingRes.json(),
      macroRes.json(),
      metalsRes.json(),
    ])

    // Tag each article with its category before merging
    const allArticles = [
      ...(energyData.articles || []).map((a) => ({ ...a, category: 'energy' })),
      ...(foodData.articles || []).map((a) => ({ ...a, category: 'food' })),
      ...(shippingData.articles || []).map((a) => ({ ...a, category: 'shipping' })),
      ...(macroData.articles || []).map((a) => ({ ...a, category: 'macro' })),
      ...(metalsData.articles || []).map((a) => ({ ...a, category: 'metals' })),
    ]

    // Deduplicate by URL and filter off-topic articles
    const seen = new Set()
    const unique = allArticles.filter((a) => {
      if (!a.url || seen.has(a.url)) return false
      if (!isRelevant(a)) return false
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
