import { useState, useEffect, useCallback } from 'react'
import { NEWS_CATEGORY_KEYWORDS } from '../utils/constants'

function detectCategory(article) {
  if (article.category) return article.category
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

  const fetchNews = useCallback(async (opts = {}) => {
    const { force = false } = opts
    setLoading(true)
    try {
      const forceParam = force ? '?force=true' : ''

      // DB-backed serverless proxy: optional force refresh updates DB upstream-first.
      const res = await fetch(`/api/news${forceParam}`, {
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
  }, [fetchNews])

  return { articles, loading, error, refresh: fetchNews }
}
