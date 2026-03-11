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

export function useInflationData() {
  const [eu, setEU] = useState(makeState())
  const [uk, setUK] = useState(makeState())
  const [us, setUS] = useState(makeState())

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
  }, [])

  return { eu, uk, us }
}
