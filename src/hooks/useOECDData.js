import { useState, useEffect } from 'react'
import { shortMonth } from '../utils/formatters'

// Fallback — approximate MoM food CPI values
const FALLBACK = {
  USA: [
    { period: '2025-03', value: 0.3 }, { period: '2025-04', value: 0.4 },
    { period: '2025-05', value: 0.3 }, { period: '2025-06', value: 0.2 },
    { period: '2025-07', value: 0.3 }, { period: '2025-08', value: 0.2 },
    { period: '2025-09', value: 0.3 }, { period: '2025-10', value: 0.4 },
    { period: '2025-11', value: 0.3 }, { period: '2025-12', value: 0.3 },
    { period: '2026-01', value: 0.4 }, { period: '2026-02', value: 0.3 },
  ],
  GBR: [
    { period: '2025-03', value: 0.5 }, { period: '2025-04', value: 0.4 },
    { period: '2025-05', value: 0.3 }, { period: '2025-06', value: 0.3 },
    { period: '2025-07', value: 0.4 }, { period: '2025-08', value: 0.3 },
    { period: '2025-09', value: 0.4 }, { period: '2025-10', value: 0.5 },
    { period: '2025-11', value: 0.4 }, { period: '2025-12', value: 0.3 },
    { period: '2026-01', value: 0.5 }, { period: '2026-02', value: 0.4 },
  ],
  CHN: [
    { period: '2025-03', value: -0.2 }, { period: '2025-04', value: 0.1 },
    { period: '2025-05', value: 0.0 }, { period: '2025-06', value: 0.1 },
    { period: '2025-07', value: 0.2 }, { period: '2025-08', value: 0.1 },
    { period: '2025-09', value: 0.0 }, { period: '2025-10', value: -0.1 },
    { period: '2025-11', value: 0.1 }, { period: '2025-12', value: 0.0 },
    { period: '2026-01', value: 0.2 }, { period: '2026-02', value: 0.1 },
  ],
}

function toChartFormat(arr) {
  return arr.map(d => ({
    month: shortMonth(d.period),
    value: parseFloat(d.value?.toFixed(2) ?? 0),
  }))
}

export function useOECDData() {
  const [data, setData] = useState({ usa: [], gbr: [], chn: [], loading: true, isFallback: false })

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch('/api/oecd', { signal: AbortSignal.timeout(15000) })
        if (!res.ok) throw new Error(`OECD proxy: ${res.status}`)
        const json = await res.json()
        if (json.status !== 'ok') throw new Error(json.message)
        setData({
          usa: toChartFormat(json.data.USA ?? []),
          gbr: toChartFormat(json.data.GBR ?? []),
          chn: toChartFormat(json.data.CHN ?? []),
          loading: false,
          isFallback: false,
        })
      } catch {
        setData({
          usa: toChartFormat(FALLBACK.USA),
          gbr: toChartFormat(FALLBACK.GBR),
          chn: toChartFormat(FALLBACK.CHN),
          loading: false,
          isFallback: true,
        })
      }
    }
    fetch_()
  }, [])

  return data
}
