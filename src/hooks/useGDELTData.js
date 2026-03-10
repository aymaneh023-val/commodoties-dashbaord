import { useState, useEffect } from 'react'
import { CORS_PROXIES } from '../utils/constants'

const GDELT_URL =
  'https://api.gdeltproject.org/api/v2/doc/doc?' +
  'query=food+prices+OR+oil+OR+Iran+war+OR+shipping+disruption&' +
  'mode=timelinevol&timespan=30d&format=json'

function parseGDELT(json) {
  // GDELT timelinevol returns {timeline:[{series:[{date,value,normvalue},...],query}]}
  try {
    const series = json?.timeline?.[0]?.series ?? json?.data ?? []
    if (!Array.isArray(series) || !series.length) return null
    return series.map(pt => ({
      date: String(pt.date).slice(0, 8), // YYYYMMDD
      value: parseFloat(pt.normvalue ?? pt.value ?? 0),
    })).filter(d => !isNaN(d.value))
  } catch {
    return null
  }
}

export function useGDELTData() {
  const [sparkline, setSparkline] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch_() {
      // Try direct, then proxies
      const attempts = [
        () => fetch(GDELT_URL, { signal: AbortSignal.timeout(8000) }),
        ...CORS_PROXIES.map(proxy => () =>
          fetch(proxy(GDELT_URL), { signal: AbortSignal.timeout(8000) })
        ),
      ]
      for (const attempt of attempts) {
        try {
          const res = await attempt()
          if (!res.ok) continue
          const json = await res.json()
          const data = parseGDELT(json)
          if (data?.length) {
            setSparkline(data)
            setLoading(false)
            return
          }
        } catch { /* try next */ }
      }
      // Silently fail — sparkline just won't show
      setLoading(false)
    }
    fetch_()
  }, [])

  return { sparkline, loading }
}
