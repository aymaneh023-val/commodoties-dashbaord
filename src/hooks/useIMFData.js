import { useState, useEffect } from 'react'
import { CORS_PROXIES } from '../utils/constants'
import { shortMonth } from '../utils/formatters'

const IMF_PFERT_URL =
  'https://imfstatapi.imf.org/v1/data/PCPS/M.W00.PFERT.IX?lastNObservations=13'

function parseIMFResponse(json) {
  try {
    // SDMX-JSON format
    const structure = json.structure || json.Structure
    const timeDim = (structure?.dimensions?.observation || []).find(
      d => d.id === 'TIME_PERIOD' || d.id === 'time'
    )
    const timeValues = timeDim?.values?.map(v => v.id) ?? []
    const observations = json.dataSets?.[0]?.observations ?? {}

    return timeValues.map((period, i) => {
      const obs = observations[String(i)]
      const value = obs ? parseFloat(obs[0]) : null
      return {
        month: shortMonth(period.replace('M', '-')), // "2025M01" → "Jan '25"
        monthStr: period,
        value: isNaN(value) ? null : value,
      }
    }).filter(d => d.value != null)
  } catch {
    return null
  }
}

async function fetchIMFPFERT() {
  // 1. Try direct
  try {
    const r = await fetch(IMF_PFERT_URL, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    })
    if (r.ok) {
      const json = await r.json()
      const data = parseIMFResponse(json)
      if (data?.length) return { data, isFallback: false }
    }
  } catch { /* fall through */ }

  // 2. Proxy chain
  for (const proxy of CORS_PROXIES) {
    try {
      const r = await fetch(proxy(IMF_PFERT_URL), { signal: AbortSignal.timeout(10000) })
      if (r.ok) {
        const json = await r.json()
        const data = parseIMFResponse(json)
        if (data?.length) return { data, isFallback: false }
      }
    } catch { /* try next */ }
  }

  return { data: [], isFallback: false }
}

export function useIMFData() {
  const [pfert, setPfert] = useState({ data: [], loading: true, isFallback: false })

  useEffect(() => {
    fetchIMFPFERT().then(result => {
      setPfert({ ...result, loading: false })
    })
  }, [])

  const latest = pfert.data[pfert.data.length - 1] ?? null
  const prev   = pfert.data[pfert.data.length - 2] ?? null
  const pctChange = latest && prev ? ((latest.value - prev.value) / prev.value) * 100 : null

  return { pfert: { ...pfert, latest, pctChange } }
}
