import { useState, useEffect, useCallback } from 'react'

const TICKERS = {
  brent: 'BZ=F',
  ttf:   'TTF=F',
  bdry:  'BDRY',
  zim:   'ZIM',
  urea:  'UFB=F',
}

const TICKER_LIST = Object.values(TICKERS).join(',')

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

export function useCommodityData() {
  const [data, setData] = useState(() => {
    const s = {}
    Object.keys(TICKERS).forEach((k) => { s[k] = { ...initialState } })
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
      Object.entries(TICKERS).forEach(([key, ticker]) => {
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
