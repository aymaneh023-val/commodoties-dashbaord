import { useState, useEffect } from 'react'
import { CORS_PROXIES } from '../utils/constants'
import { shortMonth } from '../utils/formatters'

const IMF_PFERT_URL =
  'https://imfstatapi.imf.org/v1/data/PCPS/M.W00.PFERT.IX?lastNObservations=13'

// Fallback static data (index 2016=100, approximate recent values)
const FALLBACK_PFERT = [
  { month: 'Feb \'25', value: 128 }, { month: 'Mar \'25', value: 131 },
  { month: 'Apr \'25', value: 134 }, { month: 'May \'25', value: 138 },
  { month: 'Jun \'25', value: 142 }, { month: 'Jul \'25', value: 139 },
  { month: 'Aug \'25', value: 136 }, { month: 'Sep \'25', value: 133 },
  { month: 'Oct \'25', value: 130 }, { month: 'Nov \'25', value: 127 },
  { month: 'Dec \'25', value: 124 }, { month: 'Jan \'26', value: 129 },
  { month: 'Feb \'26', value: 133 },
]

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

  return { data: FALLBACK_PFERT, isFallback: true }
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
