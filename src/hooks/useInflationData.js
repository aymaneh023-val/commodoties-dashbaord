import { useState, useEffect } from 'react'
import { shortMonth } from '../utils/formatters'

function makeState() {
  return { data: [], loading: true, error: null }
}

async function fetchEU() {
  const res = await fetch('/api/eurostat', { signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`Eurostat proxy: ${res.status}`)
  const json = await res.json()
  if (json.status !== 'ok') throw new Error('Eurostat returned error')
  return json.data.map((d) => ({ month: d.month, label: shortMonth(d.month), value: d.value }))
}

async function fetchUK() {
  const res = await fetch('/api/ons', { signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`ONS proxy: ${res.status}`)
  const json = await res.json()
  if (json.status !== 'ok') throw new Error('ONS returned error')
  return json.data.map((d) => ({ month: d.month, label: shortMonth(d.month), value: d.value }))
}

async function fetchUS() {
  const res = await fetch('/api/bls', { signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`BLS proxy: ${res.status}`)
  const json = await res.json()
  if (json.status !== 'ok') throw new Error('BLS returned error')
  return json.data.map((d) => ({ month: d.month, label: shortMonth(d.month), value: d.value }))
}

async function fetchEUCountries() {
  const res = await fetch('/api/eurostat-countries', { signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`Eurostat countries: ${res.status}`)
  const json = await res.json()
  if (json.status !== 'ok') throw new Error('Eurostat countries returned error')
  // Shape each country series the same way as the other series
  const shaped = {}
  for (const [code, series] of Object.entries(json.countries)) {
    shaped[code] = series.map((d) => ({ month: d.month, label: shortMonth(d.month), value: d.value }))
  }
  return shaped
}

export function useInflationData() {
  const [eu, setEU] = useState(makeState())
  const [uk, setUK] = useState(makeState())
  const [us, setUS] = useState(makeState())
  const [countries, setCountries] = useState({ data: {}, loading: true, error: null })

  useEffect(() => {
    fetchEU()
      .then((data) => setEU({ data, loading: false, error: null }))
      .catch((err) => setEU({ data: [], loading: false, error: err.message }))

    fetchUK()
      .then((data) => setUK({ data, loading: false, error: null }))
      .catch((err) => setUK({ data: [], loading: false, error: err.message }))

    fetchUS()
      .then((data) => setUS({ data, loading: false, error: null }))
      .catch((err) => setUS({ data: [], loading: false, error: err.message }))

    fetchEUCountries()
      .then((data) => setCountries({ data, loading: false, error: null }))
      .catch((err) => setCountries({ data: {}, loading: false, error: err.message }))
  }, [])

  return { eu, uk, us, countries }
}
