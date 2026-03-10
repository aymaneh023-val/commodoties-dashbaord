import { useState, useEffect } from 'react'
import { shortMonth } from '../utils/formatters'

function parsePeriod(str) {
  // handles "2026M02", "Feb-26", "2026-02", "42036" (Excel serial)
  if (/^\d{4}M\d{2}$/.test(str)) {
    const yr = str.slice(0, 4)
    const mo = str.slice(5)
    return shortMonth(`${yr}-${mo}`)
  }
  if (/^\d{4}-\d{2}$/.test(str)) return shortMonth(str)
  return str
}

export function useGPRData() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch('/api/gpr', { signal: AbortSignal.timeout(20000) })
        if (!res.ok) throw new Error(`GPR proxy: ${res.status}`)
        const json = await res.json()
        if (json.status !== 'ok' || !json.data?.length) throw new Error('Empty GPR data')
        setHistory(json.data.map(d => ({ month: parsePeriod(d.period), value: d.value })))
      } catch {
        setHistory([])
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetch_()
  }, [])

  const latest = history[history.length - 1] ?? null
  const gprValue = latest?.value ?? null

  function getGPRStatus(v) {
    if (v == null) return null
    if (v > 200) return { label: 'High',      color: '#f87171' }
    if (v > 150) return { label: 'Above avg', color: '#f59e0b' }
    if (v > 100) return { label: 'Average',   color: '#818cf8' }
    return       { label: 'Low',       color: '#4ade80' }
  }

  return { history, loading, error, gprValue, status: getGPRStatus(gprValue) }
}
