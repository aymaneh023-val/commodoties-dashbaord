import { createClient } from '@supabase/supabase-js'

/**
 * /api/oecd-barometer — Fetch OECD Consumer Barometer (CCICP),
 * upsert into consumer_barometer table.
 *
 * Available for 8 countries/areas (EU27_2020 and SAU return 404).
 */

const COUNTRIES = [
  { code: 'AUS', name: 'Australia' },
  { code: 'GBR', name: 'United Kingdom' },
  { code: 'USA', name: 'United States' },
  { code: 'BRA', name: 'Brazil' },
  { code: 'CHN', name: 'China' },
  { code: 'IND', name: 'India' },
  { code: 'ZAF', name: 'South Africa' },
  { code: 'OECDE', name: 'OECD Europe' },
]

const FETCH_MONTHS = 24

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
}

/**
 * Parse SDMX-ML Generic Data XML response into observations.
 */
function parseSdmxXml(xml) {
  const observations = []
  const obsRegex = /<generic:Obs>([\s\S]*?)<\/generic:Obs>/g
  let obsMatch
  while ((obsMatch = obsRegex.exec(xml)) !== null) {
    const obsBlock = obsMatch[1]
    const dims = {}
    const dimRegex = /<generic:Value id="([^"]+)" value="([^"]*)"/g
    let dimMatch
    while ((dimMatch = dimRegex.exec(obsBlock)) !== null) {
      dims[dimMatch[1]] = dimMatch[2]
    }
    const valMatch = obsBlock.match(/<generic:ObsValue value="([^"]*)"/)
    if (!valMatch || !valMatch[1]) continue
    const country = dims['REF_AREA']
    const period = dims['TIME_PERIOD']
    const indicator = dims['MEASURE'] || 'CCICP'
    const value = parseFloat(valMatch[1])
    if (country && period && !isNaN(value)) {
      observations.push({ country, period, indicator, value })
    }
  }
  return observations
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const supabase = getSupabase()
  const now = new Date().toISOString()
  const results = { fetched: 0, upserted: 0, errors: [] }

  try {
    const refs = COUNTRIES.map((c) => c.code).join('+')
    const url =
      `https://sdmx.oecd.org/public/rest/data/OECD.SDD.STES,DSD_STES@DF_CSBAR,4.0/` +
      `${refs}.M......./all?lastNObservations=${FETCH_MONTHS}&dimensionAtObservation=AllDimensions`

    const r = await fetch(url, {
      headers: {
        Accept: 'application/vnd.sdmx.genericdata+xml;version=2.1',
        'User-Agent': 'EU-Energy-Monitor/2.0',
      },
      signal: AbortSignal.timeout(30000),
    })

    if (!r.ok) {
      const body = await r.text().catch(() => '')
      throw new Error(`OECD SDMX barometer ${r.status}: ${body.substring(0, 200)}`)
    }

    const xml = await r.text()
    const observations = parseSdmxXml(xml)
    results.fetched = observations.length

    const rows = observations.map((o) => {
      const meta = COUNTRIES.find((c) => c.code === o.country)
      return {
        country_code: o.country,
        country_name: meta?.name ?? o.country,
        period: o.period,
        indicator: o.indicator,
        value: parseFloat(Number(o.value).toFixed(4)),
        fetched_at: now,
      }
    })

    if (rows.length > 0) {
      const BATCH = 500
      for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH)
        const { error } = await supabase
          .from('consumer_barometer')
          .upsert(batch, { onConflict: 'country_code,indicator,period' })
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
    console.error('oecd-barometer error:', err)
    return res.status(500).json({ status: 'error', message: err.message })
  }
}
