import { useState, useEffect } from 'react'
import { EUROSTAT_HEADLINE, EUROSTAT_FOOD } from '../utils/constants'
import { shortMonth } from '../utils/formatters'

function parseEurostat(json) {
  try {
    const timeDim = json.dimension?.time?.category
    const timeIndex = timeDim?.index ?? {}
    const values = json.value ?? {}

    const periods = Object.entries(timeIndex).sort((a, b) => a[1] - b[1])

    return periods.map(([period, idx]) => ({
      month: shortMonth(period),
      monthStr: period,
      value: values[String(idx)] != null ? parseFloat(Number(values[String(idx)]).toFixed(2)) : null,
    })).filter((d) => d.value != null)
  } catch {
    return null
  }
}

async function fetchViaProxy() {
  const res = await fetch('/api/eurostat', { signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`Eurostat proxy: ${res.status}`)
  const json = await res.json()
  if (json.status !== 'ok') throw new Error('Eurostat proxy returned error')

  const headlineData = parseEurostat(json.headline)
  const foodData = parseEurostat(json.food)
  if (!headlineData?.length && !foodData?.length) throw new Error('Empty Eurostat proxy data')

  return { headlineData, foodData }
}

async function fetchDirectEurostat(url) {
  // 1. Try direct
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      mode: 'cors',
      signal: AbortSignal.timeout(10000),
    })
    if (res.ok) return await res.json()
  } catch { /* fall through */ }

  // 2. corsproxy.io
  try {
    const proxied = `https://corsproxy.io/?${encodeURIComponent(url)}`
    const res = await fetch(proxied, { signal: AbortSignal.timeout(10000) })
    if (res.ok) return await res.json()
  } catch { /* fall through */ }

  // 3. allorigins
  const proxied2 = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
  const res = await fetch(proxied2, { signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error('All Eurostat fetch attempts failed')
  return await res.json()
}

export function useEurostatData() {
  const [headline, setHeadline] = useState({ data: [], loading: true, error: false, isFallback: false })
  const [food, setFood] = useState({ data: [], loading: true, error: false, isFallback: false })

  useEffect(() => {
    async function fetchAll() {
      // Try server-side proxy first (works on Vercel)
      try {
        const { headlineData, foodData } = await fetchViaProxy()
        if (headlineData?.length) {
          setHeadline({ data: headlineData, loading: false, error: false, isFallback: false })
        } else {
          setHeadline({ data: [], loading: false, error: true, isFallback: false })
        }
        if (foodData?.length) {
          setFood({ data: foodData, loading: false, error: false, isFallback: false })
        } else {
          setFood({ data: [], loading: false, error: true, isFallback: false })
        }
        return
      } catch { /* fall through to direct/CORS */ }

      // Fallback: direct + CORS proxies (works on localhost)
      try {
        const json = await fetchDirectEurostat(EUROSTAT_HEADLINE)
        const data = parseEurostat(json)
        if (data?.length) setHeadline({ data, loading: false, error: false, isFallback: false })
        else setHeadline({ data: [], loading: false, error: true, isFallback: false })
      } catch {
        setHeadline({ data: [], loading: false, error: true, isFallback: false })
      }

      try {
        const json = await fetchDirectEurostat(EUROSTAT_FOOD)
        const data = parseEurostat(json)
        if (data?.length) setFood({ data, loading: false, error: false, isFallback: false })
        else setFood({ data: [], loading: false, error: true, isFallback: false })
      } catch {
        setFood({ data: [], loading: false, error: true, isFallback: false })
      }
    }

    fetchAll()
  }, [])

  const headlineLatest = headline.data.length > 0 ? headline.data[headline.data.length - 1] : null
  const foodLatest = food.data.length > 0 ? food.data[food.data.length - 1] : null

  const combined = headline.data.map((h, i) => ({
    month: h.month,
    headline: h.value,
    food: food.data[i]?.value ?? null,
  }))

  return {
    headline: { ...headline, latest: headlineLatest },
    food: { ...food, latest: foodLatest },
    combined,
  }
}
