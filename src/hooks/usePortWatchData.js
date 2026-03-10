import { useState, useEffect } from 'react'

const PORTWATCH_URL =
  'https://hub.arcgis.com/api/v1/items/42132aa4e2fc4d41bdaf9a445f688931/downloads/data?format=csv'

// Chokepoint name patterns to match against CSV rows
const CHOKEPOINT_PATTERNS = {
  hormuz: ['hormuz', 'persian'],
  bab:    ['bab', 'mandeb', 'bab-el'],
  suez:   ['suez'],
  persian: ['persian gulf', 'gulf lanes'],
}

function parseCSV(text) {
  const lines = text.split('\n').filter(Boolean)
  if (lines.length < 2) return null
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase())

  // Find relevant column indices
  const chokeIdx = headers.findIndex(h => h.includes('choke') || h.includes('strait') || h.includes('name') || h.includes('port'))
  const countIdx = headers.findIndex(h => h.includes('vessel') || h.includes('count') || h.includes('transit') || h.includes('traffic'))
  const dateIdx  = headers.findIndex(h => h.includes('date') || h.includes('time') || h.includes('period'))

  if (countIdx === -1 || dateIdx === -1) return null

  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map(c => c.replace(/"/g, '').trim())
    const name   = chokeIdx >= 0 ? (cells[chokeIdx] ?? '').toLowerCase() : ''
    const count  = parseFloat(cells[countIdx])
    const date   = cells[dateIdx]
    if (!isNaN(count) && date) rows.push({ name, count, date })
  }

  // Sort by date and compute 30d average + latest for each chokepoint
  const now = Date.now()
  const thirtyDays = 30 * 24 * 3600 * 1000

  const result = {}
  for (const [id, patterns] of Object.entries(CHOKEPOINT_PATTERNS)) {
    const relevant = rows.filter(r => patterns.some(p => r.name.includes(p)))
    if (!relevant.length) continue

    // Sort and get recent 30d
    const sorted = relevant.sort((a, b) => new Date(b.date) - new Date(a.date))
    const recent30 = sorted.filter(r => now - new Date(r.date).getTime() < thirtyDays)
    const latest = sorted[0]?.count ?? null
    const avg30 = recent30.length
      ? recent30.reduce((s, r) => s + r.count, 0) / recent30.length
      : null

    const deviation = (latest != null && avg30) ? ((latest - avg30) / avg30) * 100 : null
    result[id] = { latest: Math.round(latest ?? 0), avg30: Math.round(avg30 ?? 0), deviation }
  }

  return Object.keys(result).length ? result : null
}

function getStatus(deviation) {
  if (deviation == null) return null
  if (deviation < -40) return 'CRITICAL'
  if (deviation < -25) return 'DISRUPTED'
  if (deviation < -10) return 'WATCH'
  return 'NORMAL'
}

export function usePortWatchData() {
  const [portwatch, setPortwatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch(PORTWATCH_URL, { signal: AbortSignal.timeout(20000) })
        if (!res.ok) throw new Error(`PortWatch: ${res.status}`)
        const text = await res.text()
        const parsed = parseCSV(text)
        if (!parsed) throw new Error('Could not parse PortWatch CSV')

        const withStatus = {}
        for (const [id, d] of Object.entries(parsed)) {
          withStatus[id] = { ...d, status: getStatus(d.deviation) }
        }
        setPortwatch(withStatus)
        setLastUpdated(new Date())
      } catch (err) {
        console.warn('PortWatch fetch failed (falling back to static):', err.message)
        setPortwatch(null)
      } finally {
        setLoading(false)
      }
    }
    fetch_()
  }, [])

  return { portwatch, loading, lastUpdated }
}
