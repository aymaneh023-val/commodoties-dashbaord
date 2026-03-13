import { createClient } from '@supabase/supabase-js'

/**
 * /api/oecd-cpi — Fetch OECD CPI data for 9 countries, upsert into inflation_oecd.
 *
 * Strategy per country:
 *   - AUS, GBR, EU27_2020, CHN, ZAF: CP01 with GY (YoY %) directly available
 *   - USA, SAU: CP01 available as IX (index level), compute YoY from index
 *   - BRA, IND: CP01 unavailable/stale, fall back to headline CPI (_T with GY)
 */

const COUNTRIES = [
  { code: 'AUS', name: 'Australia',      strategy: 'cp01_gy' },
  { code: 'GBR', name: 'United Kingdom', strategy: 'cp01_gy' },
  { code: 'USA', name: 'United States',  strategy: 'cp01_ix' },
  { code: 'EU27_2020', name: 'EU 27',    strategy: 'cp01_gy' },
  { code: 'BRA', name: 'Brazil',         strategy: 'headline' },
  { code: 'CHN', name: 'China',          strategy: 'cp01_gy' },
  { code: 'IND', name: 'India',          strategy: 'headline' },
  { code: 'SAU', name: 'Saudi Arabia',   strategy: 'cp01_ix' },
  { code: 'ZAF', name: 'South Africa',   strategy: 'cp01_gy' },
]

// Months of history to pull (we fetch 36 to cover potential gaps, trim to 24)
const FETCH_MONTHS = 36

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
}

/**
 * Build the SDMX URL for a group of countries with shared query parameters.
 */
function buildSdmxUrl(countryCodes, expenditure, unitMeasure, transformation) {
  const refs = countryCodes.join('+')
  // Dimension order: REF_AREA.FREQ.METHODOLOGY.MEASURE.UNIT_MEASURE.EXPENDITURE.ADJUSTMENT.TRANSFORMATION
  // Using SDMX filter: REF_AREA.FREQ.METHODOLOGY.MEASURE.UNIT_MEASURE.EXPENDITURE.ADJUSTMENT.TRANSFORMATION...
  const filter = `${refs}.M.N.CPI.${unitMeasure}.${expenditure}.N.${transformation}`
  return (
    `https://sdmx.oecd.org/public/rest/data/OECD.SDD.TPS,DSD_PRICES@DF_PRICES_ALL,1.0/` +
    `${filter}.../all?lastNObservations=${FETCH_MONTHS}&dimensionAtObservation=AllDimensions`
  )
}

/**
 * Parse SDMX-ML Generic Data XML response into observations.
 * Returns array of { country, period, value }.
 */
function parseSdmxXml(xml) {
  const observations = []

  // Match each Obs block
  const obsRegex = /<generic:Obs>([\s\S]*?)<\/generic:Obs>/g
  let obsMatch
  while ((obsMatch = obsRegex.exec(xml)) !== null) {
    const obsBlock = obsMatch[1]

    // Extract dimension values
    const dims = {}
    const dimRegex = /<generic:Value id="([^"]+)" value="([^"]*)"/g
    let dimMatch
    while ((dimMatch = dimRegex.exec(obsBlock)) !== null) {
      dims[dimMatch[1]] = dimMatch[2]
    }

    // Extract observation value
    const valMatch = obsBlock.match(/<generic:ObsValue value="([^"]*)"/)
    if (!valMatch || !valMatch[1]) continue

    const country = dims['REF_AREA']
    const period = dims['TIME_PERIOD']
    const value = parseFloat(valMatch[1])

    if (country && period && !isNaN(value)) {
      observations.push({ country, period, value })
    }
  }
  return observations
}

/**
 * Compute YoY % change from monthly index values.
 * For each month M, YoY = ((index_M / index_M-12) - 1) * 100
 */
function computeYoyFromIndex(observations) {
  // Group by country
  const byCountry = {}
  for (const obs of observations) {
    if (!byCountry[obs.country]) byCountry[obs.country] = {}
    byCountry[obs.country][obs.period] = obs.value
  }

  const results = []
  for (const [country, periodMap] of Object.entries(byCountry)) {
    const periods = Object.keys(periodMap).sort()
    for (const period of periods) {
      // Compute the period 12 months ago
      const [yearStr, monthStr] = period.split('-')
      const year = parseInt(yearStr)
      const month = parseInt(monthStr)
      const prevYear = month <= 12 ? year - 1 : year
      const prevMonth = month // same month last year
      const prevPeriod = `${prevYear}-${String(prevMonth).padStart(2, '0')}`

      const current = periodMap[period]
      const previous = periodMap[prevPeriod]

      if (previous != null && previous !== 0) {
        const yoy = ((current / previous) - 1) * 100
        results.push({
          country,
          period,
          value: parseFloat(yoy.toFixed(2)),
        })
      }
    }
  }
  return results
}

/**
 * Fetch observations for a batch of countries with the same strategy.
 */
async function fetchBatch(countryCodes, expenditure, unitMeasure, transformation) {
  const url = buildSdmxUrl(countryCodes, expenditure, unitMeasure, transformation)

  const r = await fetch(url, {
    headers: {
      Accept: 'application/vnd.sdmx.genericdata+xml;version=2.1',
      'User-Agent': 'EU-Energy-Monitor/2.0',
    },
    signal: AbortSignal.timeout(30000),
  })

  if (!r.ok) {
    const body = await r.text().catch(() => '')
    throw new Error(`OECD SDMX ${r.status}: ${body.substring(0, 200)}`)
  }

  const xml = await r.text()
  return parseSdmxXml(xml)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const supabase = getSupabase()
  const now = new Date().toISOString()
  const results = { fetched: 0, upserted: 0, errors: [] }

  try {
    // Group countries by strategy
    const cp01Gy = COUNTRIES.filter((c) => c.strategy === 'cp01_gy')
    const cp01Ix = COUNTRIES.filter((c) => c.strategy === 'cp01_ix')
    const headline = COUNTRIES.filter((c) => c.strategy === 'headline')

    const allRows = []

    // 1. CP01 with GY (direct YoY %) — AUS, GBR, EU27_2020, CHN
    if (cp01Gy.length > 0) {
      try {
        const obs = await fetchBatch(
          cp01Gy.map((c) => c.code),
          'CP01', 'PA', 'GY'
        )
        results.fetched += obs.length
        for (const o of obs) {
          const meta = cp01Gy.find((c) => c.code === o.country)
          if (!meta) continue
          allRows.push({
            country_code: o.country,
            country_name: meta.name,
            period: o.period,
            value: parseFloat(Number(o.value).toFixed(2)),
            is_headline_fallback: false,
            fetched_at: now,
          })
        }
      } catch (err) {
        results.errors.push(`cp01_gy batch: ${err.message}`)
      }
    }

    // 2. CP01 with IX (index) → compute YoY — USA, SAU
    if (cp01Ix.length > 0) {
      try {
        const obs = await fetchBatch(
          cp01Ix.map((c) => c.code),
          'CP01', 'IX', '_Z'
        )
        const yoyObs = computeYoyFromIndex(obs)
        results.fetched += yoyObs.length
        for (const o of yoyObs) {
          const meta = cp01Ix.find((c) => c.code === o.country)
          if (!meta) continue
          allRows.push({
            country_code: o.country,
            country_name: meta.name,
            period: o.period,
            value: o.value,
            is_headline_fallback: false,
            fetched_at: now,
          })
        }
      } catch (err) {
        results.errors.push(`cp01_ix batch: ${err.message}`)
      }
    }

    // 3. Headline CPI (_T with GY) fallback — BRA, IND
    if (headline.length > 0) {
      try {
        const obs = await fetchBatch(
          headline.map((c) => c.code),
          '_T', 'PA', 'GY'
        )
        results.fetched += obs.length
        for (const o of obs) {
          const meta = headline.find((c) => c.code === o.country)
          if (!meta) continue
          allRows.push({
            country_code: o.country,
            country_name: meta.name,
            period: o.period,
            value: parseFloat(Number(o.value).toFixed(2)),
            is_headline_fallback: true,
            fetched_at: now,
          })
        }
      } catch (err) {
        results.errors.push(`headline batch: ${err.message}`)
      }
    }

    // Trim to last 24 months per country
    const byCountry = {}
    for (const row of allRows) {
      if (!byCountry[row.country_code]) byCountry[row.country_code] = []
      byCountry[row.country_code].push(row)
    }
    const trimmed = []
    for (const rows of Object.values(byCountry)) {
      rows.sort((a, b) => a.period.localeCompare(b.period))
      trimmed.push(...rows.slice(-24))
    }

    // Upsert into Supabase
    if (trimmed.length > 0) {
      const BATCH = 500
      for (let i = 0; i < trimmed.length; i += BATCH) {
        const batch = trimmed.slice(i, i + BATCH)
        const { error } = await supabase
          .from('inflation_oecd')
          .upsert(batch, { onConflict: 'country_code,period' })
        if (error) {
          results.errors.push(`upsert batch ${i}: ${error.message}`)
        } else {
          results.upserted += batch.length
        }
      }
    }

    const status = results.errors.length === 0 ? 'ok' : 'partial'
    return res.status(status === 'ok' ? 200 : 207).json({ status, ...results })
  } catch (err) {
    console.error('oecd-cpi error:', err)
    return res.status(500).json({ status: 'error', message: err.message })
  }
}
