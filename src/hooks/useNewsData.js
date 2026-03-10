import { useState, useEffect, useCallback } from 'react'
import { NEWS_QUERY, NEWS_CATEGORY_KEYWORDS, REFRESH_INTERVAL_NEWS } from '../utils/constants'

function detectCategory(article) {
  const text = `${article.title || ''} ${article.description || ''}`.toLowerCase()
  for (const [cat, keywords] of Object.entries(NEWS_CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) return cat
  }
  return 'ALL'
}

function detectSource(article) {
  const domain = (article.url || '').toLowerCase()
  if (domain.includes('reuters')) return 'reuters'
  if (domain.includes('ft.com') || domain.includes('financial')) return 'ft'
  if (domain.includes('bloomberg')) return 'bloomberg'
  if (domain.includes('iea.org')) return 'iea'
  return article.source?.name || 'Source'
}

export function useNewsData() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchNews = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: NEWS_QUERY,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: '40',
      })

      // Call our Vercel serverless proxy — avoids CORS + keeps API key server-side
      const res = await fetch(`/api/news?${params}`, {
        signal: AbortSignal.timeout(12000),
      })

      if (!res.ok) throw new Error(`Proxy error: ${res.status}`)

      const json = await res.json()
      if (json.status !== 'ok') throw new Error(json.message || 'NewsAPI error')

      const enriched = (json.articles || []).map((a) => ({
        ...a,
        category: detectCategory(a),
        sourceName: detectSource(a),
      }))

      setArticles(enriched)
      setError(null)
    } catch (err) {
      setError('News feed unavailable — check API key')
      console.error('News fetch failed:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNews()
    const interval = setInterval(fetchNews, REFRESH_INTERVAL_NEWS)
    return () => clearInterval(interval)
  }, [fetchNews])

  return { articles, loading, error, refresh: fetchNews }
}
