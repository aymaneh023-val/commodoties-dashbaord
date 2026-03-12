import { useState, useEffect, useCallback } from 'react'

export const FOOD_TICKERS = {
  wheat:      'ZW=F',
  corn:       'ZC=F',
  soybeans:   'ZS=F',
  soybeanOil: 'ZL=F',
  sugar:      'SB=F',
}

export const FOOD_META = {
  wheat:      { label: 'Wheat',       unit: ' ¢/bu',  note: 'CBOT Wheat (ZW=F). Global benchmark.' },
  corn:       { label: 'Corn',        unit: ' ¢/bu',  note: 'CBOT Corn (ZC=F). Major global feed grain.' },
  soybeans:   { label: 'Soybeans',    unit: ' ¢/bu',  note: 'CBOT Soybeans (ZS=F). Oil and protein crop.' },
  soybeanOil: { label: 'Soybean Oil', unit: ' ¢/lb',  note: 'CBOT Soybean Oil (ZL=F). Widely traded vegetable oil.' },
  sugar:      { label: 'Sugar',       unit: ' ¢/lb',  note: 'ICE Sugar No.11 (SB=F). Global raw sugar.' },
}

const TICKER_LIST = Object.values(FOOD_TICKERS).join(',')

const initialState = {
  price: null, pctChange: null, asOf: null, baseDate: null,
  history: [], loading: true, error: false, fromCache: false,
}

function formatAsOf(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  const day = d.getDate()
  const year = String(d.getFullYear()).slice(2)
  return `${month} ${day} '${year}`
}

function alignHistoryWithQuote(history, price, asOf) {
  const series = Array.isArray(history) ? history.filter((p) => p?.close != null) : []
  if (price == null || !Number.isFinite(price)) return series

  if (series.length === 0) {
    return [{ date: asOf ?? 'Latest', close: price }]
  }

  const next = [...series]
  const lastIdx = next.length - 1
  const last = next[lastIdx]

  if (asOf && last.date !== asOf) {
    next.push({ date: asOf, close: price })
  } else {
    next[lastIdx] = { ...last, close: price }
  }

  return next
}

// Keep quote values as the source of truth for cards and chart latest point.
function mapResult(r) {
  if (r.error || r.price == null) {
    return {
      price: null,
      pctChange: null,
      asOf: null,
      baseDate: null,
      history: [],
      loading: false,
      error: true,
      fromCache: false,
    }
  }
  const asOf = formatAsOf(r.fetched_at)
  const history = alignHistoryWithQuote(r.history ?? [], r.price, asOf)
  return {
    price: r.price,
    pctChange: r.change_pct ?? null,
    asOf,
    baseDate: history[0]?.date ?? null,
    history,
    loading: false,
    error: false,
    fromCache: r.fromCache ?? r.stale ?? false,
  }
}

export function useFoodCommoditiesData() {
  const [data, setData] = useState(() => {
    const s = {}
    Object.keys(FOOD_TICKERS).forEach((k) => { s[k] = { ...initialState } })
    return s
  })

  const fetchAll = useCallback(async (opts = {}) => {
    const { force = false } = opts
    setData((prev) => {
      const next = {}
      Object.keys(prev).forEach((k) => { next[k] = { ...prev[k], loading: true } })
      return next
    })

    try {
      const encoded = encodeURIComponent(TICKER_LIST)
      const forceParam = force ? '&force=true' : ''
      const [quotesRes, historyRes] = await Promise.all([
        fetch(`/api/quotes?tickers=${encoded}${forceParam}`),
        fetch(`/api/history?tickers=${encoded}`),
      ])

      const [quotesJson, historyJson] = await Promise.all([
        quotesRes.ok ? quotesRes.json() : Promise.resolve({ data: [] }),
        historyRes.ok ? historyRes.json() : Promise.resolve({ data: [] }),
      ])

      const byTicker = {}
      for (const r of quotesJson.data ?? []) byTicker[r.ticker] = { ...r, history: [] }
      for (const r of historyJson.data ?? []) {
        if (byTicker[r.ticker]) byTicker[r.ticker].history = r.history ?? []
      }

      const next = {}
      Object.entries(FOOD_TICKERS).forEach(([key, ticker]) => {
        next[key] = mapResult(byTicker[ticker] ?? { error: 'missing' })
      })
      setData(next)
    } catch {
      setData((prev) => {
        const next = {}
        Object.keys(prev).forEach((k) => { next[k] = { ...prev[k], loading: false, error: true } })
        return next
      })
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  return { data, refresh: fetchAll }
}
