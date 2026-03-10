import { useState, useEffect } from 'react'
import { shortMonth } from '../utils/formatters'

// Approximate fallback — GPR values 2025M02–2026M02
const FALLBACK_GPR = [
  { period: '2025M02', value: 142 }, { period: '2025M03', value: 158 },
  { period: '2025M04', value: 171 }, { period: '2025M05', value: 165 },
  { period: '2025M06', value: 153 }, { period: '2025M07', value: 148 },
  { period: '2025M08', value: 162 }, { period: '2025M09', value: 174 },
  { period: '2025M10', value: 188 }, { period: '2025M11', value: 195 },
  { period: '2025M12', value: 201 }, { period: '2026M01', value: 213 },
  { period: '2026M02', value: 207 },
]

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
  const [isFallback, setIsFallback] = useState(false)

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch('/api/gpr', { signal: AbortSignal.timeout(20000) })
        if (!res.ok) throw new Error(`GPR proxy: ${res.status}`)
        const json = await res.json()
        if (json.status !== 'ok' || !json.data?.length) throw new Error('Empty GPR data')
        setHistory(json.data.map(d => ({ month: parsePeriod(d.period), value: d.value })))
        setIsFallback(false)
      } catch {
        setHistory(FALLBACK_GPR.map(d => ({ month: parsePeriod(d.period), value: d.value })))
        setIsFallback(true)
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
    if (v > 200) return { label: 'CRITICAL',  color: '#f87171' }
    if (v > 150) return { label: 'ELEVATED',  color: '#f59e0b' }
    if (v > 100) return { label: 'MODERATE',  color: '#818cf8' }
    return       { label: 'NORMAL',    color: '#4ade80' }
  }

  return { history, loading, isFallback, gprValue, status: getGPRStatus(gprValue) }
}
