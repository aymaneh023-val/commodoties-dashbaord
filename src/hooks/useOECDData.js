import { useState, useEffect } from 'react'
import { shortMonth } from '../utils/formatters'

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
          usa: [],
          gbr: [],
          chn: [],
          loading: false,
          isFallback: false,
        })
      }
    }
    fetch_()
  }, [])

  return data
}
