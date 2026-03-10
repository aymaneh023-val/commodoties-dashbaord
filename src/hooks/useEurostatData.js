import { useState, useEffect } from 'react'
import { EUROSTAT_HEADLINE, EUROSTAT_FOOD } from '../utils/constants'
import { shortMonth } from '../utils/formatters'

const FALLBACK_HEADLINE = Array.from({ length: 13 }, (_, i) => {
  const d = new Date(2025, i, 1)
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }),
    monthStr: `2025-${String(i + 1).padStart(2, '0')}`,
    value: +(2.0 + Math.sin(i * 0.5) * 0.5).toFixed(1),
  }
})

const FALLBACK_FOOD = Array.from({ length: 13 }, (_, i) => {
  const d = new Date(2025, i, 1)
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }),
    monthStr: `2025-${String(i + 1).padStart(2, '0')}`,
    value: +(3.0 + Math.sin(i * 0.4) * 0.7).toFixed(1),
  }
})

async function fetchEurostat(url) {
  // 1. Try direct fetch with explicit Accept header
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      mode: 'cors',
      signal: AbortSignal.timeout(10000),
    })
    if (res.ok) return await res.json()
  } catch {
    // fall through to proxy
  }

  // 2. Fallback: corsproxy.io
  try {
    const proxied = `https://corsproxy.io/?${encodeURIComponent(url)}`
    const res = await fetch(proxied, { signal: AbortSignal.timeout(10000) })
    if (res.ok) return await res.json()
  } catch {
    // fall through to allorigins
  }

  // 3. Fallback: allorigins
  const proxied2 = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
  const res = await fetch(proxied2, { signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error('All Eurostat fetch attempts failed')
  return await res.json()
}

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

export function useEurostatData() {
  const [headline, setHeadline] = useState({ data: [], loading: true, error: false, isFallback: false })
  const [food, setFood] = useState({ data: [], loading: true, error: false, isFallback: false })

  useEffect(() => {
    async function fetchHeadline() {
      try {
        const json = await fetchEurostat(EUROSTAT_HEADLINE)
        const data = parseEurostat(json)
        if (!data || data.length === 0) throw new Error('Empty parse')
        setHeadline({ data, loading: false, error: false, isFallback: false })
      } catch {
        setHeadline({ data: FALLBACK_HEADLINE, loading: false, error: true, isFallback: true })
      }
    }

    async function fetchFood() {
      try {
        const json = await fetchEurostat(EUROSTAT_FOOD)
        const data = parseEurostat(json)
        if (!data || data.length === 0) throw new Error('Empty parse')
        setFood({ data, loading: false, error: false, isFallback: false })
      } catch {
        setFood({ data: FALLBACK_FOOD, loading: false, error: true, isFallback: true })
      }
    }

    fetchHeadline()
    fetchFood()
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
