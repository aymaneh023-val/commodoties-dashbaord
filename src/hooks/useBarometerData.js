import { useState, useEffect, useCallback } from 'react'
import { shortMonth } from '../utils/formatters'

/**
 * Fetches OECD Consumer Barometer data from /api/barometer.
 * Returns { countries, loading, error, refresh }.
 *
 * countries is an object keyed by country_code:
 *   { AUS: { name, data: [{ month, label, value }] }, ... }
 */
export function useBarometerData() {
  const [countries, setCountries] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/barometer', { signal: AbortSignal.timeout(20000) })
      if (!res.ok) throw new Error(`Barometer API: ${res.status}`)
      const json = await res.json()
      if (json.status !== 'ok') throw new Error('Barometer API returned error')

      const shaped = {}
      for (const c of json.countries) {
        shaped[c.country_code] = {
          name: c.country_name,
          data: c.data.map((d) => ({
            month: d.period,
            label: shortMonth(d.period),
            value: d.value,
          })),
        }
      }
      setCountries(shaped)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { countries, loading, error, refresh: fetchData }
}
