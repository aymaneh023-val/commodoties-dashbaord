import { useState, useEffect, useCallback } from 'react'

export const FOOD_TICKERS = {
  wheat:      'ZW=F',
  corn:       'ZC=F',
  soybeans:   'ZS=F',
  soybeanOil: 'ZL=F',
  sugar:      'SB=F',
}

export const FOOD_META = {
  wheat:      { label: 'Wheat',       unit: ' cents per bushel',  note: 'CBOT Wheat (ZW=F). Global benchmark.' },
  corn:       { label: 'Corn',        unit: ' cents per bushel',  note: 'CBOT Corn (ZC=F). Primary feed grain.' },
  soybeans:   { label: 'Soybeans',    unit: ' cents per bushel',  note: 'CBOT Soybeans (ZS=F). Oil and protein crop.' },
  soybeanOil: { label: 'Soybean Oil', unit: ' cents per pound',   note: 'CBOT Soybean Oil (ZL=F). Vegetable oil benchmark.' },
  sugar:      { label: 'Sugar',       unit: ' cents per pound',   note: 'ICE Sugar No.11 (SB=F). Global raw sugar.' },
}

const TICKER_LIST = Object.values(FOOD_TICKERS).join(',')

const initialState = {
  price: null, pctChange: null, baseDate: null,
  history: [], loading: true, error: false, fromCache: false,
}

// Same mapResult as useCommodityData: use last close from history as the
// display price so the card always matches the chart's rightmost data point.
function mapResult(r) {
  if (r.error || r.price == null) {
    return { price: null, pctChange: null, baseDate: null, history: [], loading: false, error: true, fromCache: false }
  }
  const history = r.history ?? []
  const firstClose = history[0]?.close ?? null
  const lastClose = history[history.length - 1]?.close ?? null
  const price = lastClose ?? r.price
  const pctChange =
    firstClose != null && lastClose != null
      ? parseFloat((((lastClose - firstClose) / firstClose) * 100).toFixed(4))
      : r.change_pct
  return {
    price,
    pctChange,
    baseDate: history[0]?.date ?? null,
    history,
    loading: false,
    error: false,
    fromCache: r.fromCache ?? false,
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
