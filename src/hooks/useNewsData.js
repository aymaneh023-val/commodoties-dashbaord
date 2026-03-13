import { useState, useEffect, useCallback } from 'react'

export function useNewsData() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchNews = useCallback(async (opts = {}) => {
    const { force = false } = opts
    setLoading(true)
    try {
      const forceParam = force ? '?force=true' : ''
      const res = await fetch(`/api/news${forceParam}`, {
        signal: AbortSignal.timeout(12000),
      })

      if (!res.ok) throw new Error(`Proxy error: ${res.status}`)

      const json = await res.json()
      if (json.status !== 'ok') throw new Error(json.message || 'News error')

      setArticles(json.articles || [])
      setError(null)
    } catch (err) {
      setError('News feed unavailable')
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
