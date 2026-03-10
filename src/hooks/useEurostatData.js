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

function parseEurostat(json) {
  try {
    const times = json.id?.time ? json.dimension?.time?.category?.index : null
    const timeIds = json.id
    // The response structure: dimension.time.category.label gives {period: label}
    const timeDim = json.dimension?.time?.category
    const timeLabels = timeDim?.label ?? {}   // e.g. {"2024-01": "2024-01", ...}
    const timeIndex = timeDim?.index ?? {}    // e.g. {"2024-01": 0, ...}

    const values = json.value ?? {}

    // Build sorted list by index
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
        const res = await fetch(EUROSTAT_HEADLINE, { signal: AbortSignal.timeout(10000) })
        if (!res.ok) throw new Error('Eurostat headline error')
        const json = await res.json()
        const data = parseEurostat(json)
        if (!data || data.length === 0) throw new Error('Empty parse')
        setHeadline({ data, loading: false, error: false, isFallback: false })
      } catch {
        setHeadline({ data: FALLBACK_HEADLINE, loading: false, error: true, isFallback: true })
      }
    }

    async function fetchFood() {
      try {
        const res = await fetch(EUROSTAT_FOOD, { signal: AbortSignal.timeout(10000) })
        if (!res.ok) throw new Error('Eurostat food error')
        const json = await res.json()
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

  // Latest values
  const headlineLatest = headline.data.length > 0 ? headline.data[headline.data.length - 1] : null
  const foodLatest = food.data.length > 0 ? food.data[food.data.length - 1] : null

  // Combined for dual-line chart
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
