import { useState, useEffect, useCallback } from 'react'

export const FOOD_TICKERS = {
  wheat:      'ZW=F',
  corn:       'ZC=F',
  soybeans:   'ZS=F',
  soybeanOil: 'ZL=F',
  rice:       'ZR=F',
  sugar:      'SB=F',
}

export const FOOD_META = {
  wheat:      { label: 'Wheat',       unit: ' ¢/bu',  note: 'CBOT Wheat (ZW=F). Global benchmark.' },
  corn:       { label: 'Corn',        unit: ' ¢/bu',  note: 'CBOT Corn (ZC=F). Primary feed grain.' },
  soybeans:   { label: 'Soybeans',    unit: ' ¢/bu',  note: 'CBOT Soybeans (ZS=F). Oil and protein crop.' },
  soybeanOil: { label: 'Soybean Oil', unit: ' ¢/lb',  note: 'CBOT Soybean Oil (ZL=F). Vegetable oil benchmark.' },
  rice:       { label: 'Rice',        unit: ' ¢/cwt', note: 'CBOT Rough Rice (ZR=F). Normalized to ¢/cwt.' },
  sugar:      { label: 'Sugar',       unit: ' ¢/lb',  note: 'ICE Sugar No.11 (SB=F). Global raw sugar.' },
}

const TICKER_LIST = Object.values(FOOD_TICKERS).join(',')

const initialState = {
  price: null, pctChange: null, baseDate: null,
  history: [], loading: true, error: false, fromCache: false,
}

function mapResult(r) {
  if (r.error || r.price == null) {
    return { price: null, pctChange: null, baseDate: null, history: [], loading: false, error: true, fromCache: false }
  }
  const history = r.history ?? []
  return {
    price: r.price,
    pctChange: r.change_pct,
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

  const fetchAll = useCallback(async () => {
    setData((prev) => {
      const next = {}
      Object.keys(prev).forEach((k) => { next[k] = { ...prev[k], loading: true } })
      return next
    })

    try {
      const res = await fetch(`/api/quotes?tickers=${encodeURIComponent(TICKER_LIST)}`)
      if (!res.ok) throw new Error(`quotes: ${res.status}`)
      const json = await res.json()
      const byTicker = Object.fromEntries((json.data ?? []).map((r) => [r.ticker, r]))
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
