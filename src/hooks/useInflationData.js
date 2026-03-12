import { useState, useEffect, useCallback } from 'react'
import { shortMonth } from '../utils/formatters'

function makeState() {
  return { data: [], loading: true, error: null }
}

function withForce(path, force) {
  return force ? `${path}?force=true` : path
}

export function useInflationData() {
  const [eu, setEU] = useState(makeState())
  const [uk, setUK] = useState(makeState())
  const [us, setUS] = useState(makeState())
  const [countries, setCountries] = useState({ data: {}, loading: true, error: null })

  const fetchAll = useCallback(async (opts = {}) => {
    const { force = false } = opts

    setEU((prev) => ({ ...prev, loading: true, error: null }))
    setUK((prev) => ({ ...prev, loading: true, error: null }))
    setUS((prev) => ({ ...prev, loading: true, error: null }))
    setCountries((prev) => ({ ...prev, loading: true, error: null }))

    const fetchEUForced = async () => {
      const res = await fetch(withForce('/api/eurostat', force), { signal: AbortSignal.timeout(20000) })
      if (!res.ok) throw new Error(`Eurostat proxy: ${res.status}`)
      const json = await res.json()
      if (json.status !== 'ok') throw new Error('Eurostat returned error')
      return json.data.map((d) => ({ month: d.month, label: shortMonth(d.month), value: d.value }))
    }

    const fetchUKForced = async () => {
      const res = await fetch(withForce('/api/ons', force), { signal: AbortSignal.timeout(20000) })
      if (!res.ok) throw new Error(`ONS proxy: ${res.status}`)
      const json = await res.json()
      if (json.status !== 'ok') throw new Error('ONS returned error')
      return json.data.map((d) => ({ month: d.month, label: shortMonth(d.month), value: d.value }))
    }

    const fetchUSForced = async () => {
      const res = await fetch(withForce('/api/bls', force), { signal: AbortSignal.timeout(20000) })
      if (!res.ok) throw new Error(`BLS proxy: ${res.status}`)
      const json = await res.json()
      if (json.status !== 'ok') throw new Error('BLS returned error')
      return json.data.map((d) => ({ month: d.month, label: shortMonth(d.month), value: d.value }))
    }

    const fetchCountriesForced = async () => {
      const res = await fetch(withForce('/api/eurostat-countries', force), { signal: AbortSignal.timeout(20000) })
      if (!res.ok) throw new Error(`Eurostat countries: ${res.status}`)
      const json = await res.json()
      if (json.status !== 'ok') throw new Error('Eurostat countries returned error')
      const shaped = {}
      for (const [code, series] of Object.entries(json.countries)) {
        shaped[code] = series.map((d) => ({ month: d.month, label: shortMonth(d.month), value: d.value }))
      }
      return shaped
    }

    const [euResult, ukResult, usResult, countriesResult] = await Promise.allSettled([
      fetchEUForced(),
      fetchUKForced(),
      fetchUSForced(),
      fetchCountriesForced(),
    ])

    if (euResult.status === 'fulfilled') setEU({ data: euResult.value, loading: false, error: null })
    else setEU({ data: [], loading: false, error: euResult.reason?.message ?? 'fetch failed' })

    if (ukResult.status === 'fulfilled') setUK({ data: ukResult.value, loading: false, error: null })
    else setUK({ data: [], loading: false, error: ukResult.reason?.message ?? 'fetch failed' })

    if (usResult.status === 'fulfilled') setUS({ data: usResult.value, loading: false, error: null })
    else setUS({ data: [], loading: false, error: usResult.reason?.message ?? 'fetch failed' })

    if (countriesResult.status === 'fulfilled') setCountries({ data: countriesResult.value, loading: false, error: null })
    else setCountries({ data: {}, loading: false, error: countriesResult.reason?.message ?? 'fetch failed' })
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return { eu, uk, us, countries, refresh: fetchAll }
}
