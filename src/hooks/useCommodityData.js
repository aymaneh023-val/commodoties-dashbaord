import { useState, useEffect, useCallback } from 'react'
import { ALL_SYMBOLS } from '../utils/commodityConfig'

const initialEntry = {
  price: null, pctChange: null, asOf: null, baseDate: null,
  history: [], loading: true, error: false,
}

function formatDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return null
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  const day = d.getDate()
  const year = String(d.getFullYear()).slice(2)
  return `${month} ${day} '${year}`
}

function processRows(rows) {
  if (!rows || rows.length === 0) {
    return { ...initialEntry, loading: false, error: true }
  }
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date))
  const history = sorted.map((r) => ({
    date: r.date,
    close: r.close,
    open: r.open,
    high: r.high,
    low: r.low,
  }))

  const latest = sorted[sorted.length - 1]
  // pctChange always over 30-day window regardless of total history length
  const base = sorted[Math.max(0, sorted.length - 30)]
  const price = latest.close
  const pctChange = base.close ? ((price - base.close) / base.close) * 100 : null

  return {
    price,
    pctChange,
    asOf: formatDate(latest.date),
    baseDate: formatDate(base.date),
    history,
    loading: false,
    error: false,
  }
}

export function useCommodityData() {
  const [data, setData] = useState(() => {
    const s = {}
    ALL_SYMBOLS.forEach((sym) => { s[sym] = { ...initialEntry } })
    return s
  })
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchAll = useCallback(async (opts = {}) => {
    const { force = false } = opts
    setData((prev) => {
      const next = {}
      Object.keys(prev).forEach((sym) => { next[sym] = { ...prev[sym], loading: true } })
      return next
    })

    try {
      const symbolsParam = encodeURIComponent(ALL_SYMBOLS.join(','))
      const liveParam = force ? '&live=true' : ''
      const res = await fetch(`/api/timeseries?symbols=${symbolsParam}&days=90${liveParam}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Fetch failed')

      setLastUpdated(new Date().toISOString())

      const next = {}
      ALL_SYMBOLS.forEach((sym) => {
        const rows = json.data?.[sym] ?? []
        next[sym] = processRows(rows)
      })
      setData(next)
    } catch {
      setData((prev) => {
        const next = {}
        Object.keys(prev).forEach((sym) => { next[sym] = { ...prev[sym], loading: false, error: true } })
        return next
      })
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  return { data, refresh: fetchAll, lastUpdated }
}
