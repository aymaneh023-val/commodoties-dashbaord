/**
 * Local test: fetch OECD CPI + Consumer Barometer and upsert into Supabase.
 * Run with: node scripts/test-oecd.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Config ───────────────────────────────────────────────────────
const CPI_COUNTRIES = [
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

const BARO_COUNTRIES = [
  { code: 'AUS', name: 'Australia' },
  { code: 'GBR', name: 'United Kingdom' },
  { code: 'USA', name: 'United States' },
  { code: 'BRA', name: 'Brazil' },
  { code: 'CHN', name: 'China' },
  { code: 'IND', name: 'India' },
  { code: 'ZAF', name: 'South Africa' },
  { code: 'OECDE', name: 'OECD Europe' },
]

const FETCH_MONTHS = 36

// ── SDMX XML parser ─────────────────────────────────────────────
function parseSdmxXml(xml) {
  const observations = []
  const obsRegex = /<generic:Obs>([\s\S]*?)<\/generic:Obs>/g
  let m
  while ((m = obsRegex.exec(xml)) !== null) {
    const block = m[1]
    const dims = {}
    const dRe = /<generic:Value id="([^"]+)" value="([^"]*)"/g
    let dm
    while ((dm = dRe.exec(block)) !== null) dims[dm[1]] = dm[2]
    const vMatch = block.match(/<generic:ObsValue value="([^"]*)"/)
    if (!vMatch) continue
    observations.push({
      country: dims['REF_AREA'],
      period: dims['TIME_PERIOD'],
      indicator: dims['MEASURE'] || null,
      value: parseFloat(vMatch[1]),
    })
  }
  return observations.filter((o) => o.country && o.period && !isNaN(o.value))
}

// ── Compute YoY from index ───────────────────────────────────────
function computeYoyFromIndex(observations) {
  const byCountry = {}
  for (const o of observations) {
    if (!byCountry[o.country]) byCountry[o.country] = {}
    byCountry[o.country][o.period] = o.value
  }
  const results = []
  for (const [country, pm] of Object.entries(byCountry)) {
    for (const period of Object.keys(pm).sort()) {
      const [y, mo] = period.split('-').map(Number)
      const prev = `${y - 1}-${String(mo).padStart(2, '0')}`
      if (pm[prev] != null && pm[prev] !== 0) {
        results.push({
          country,
          period,
          value: parseFloat((((pm[period] / pm[prev]) - 1) * 100).toFixed(2)),
        })
      }
    }
  }
  return results
}

// ── Fetch helper ─────────────────────────────────────────────────
async function fetchSdmx(url, label) {
  console.log(`  Fetching ${label}...`)
  const r = await fetch(url, {
    headers: {
      Accept: 'application/vnd.sdmx.genericdata+xml;version=2.1',
      'User-Agent': 'EU-Energy-Monitor/2.0',
    },
    signal: AbortSignal.timeout(45000),
  })
  if (!r.ok) {
    const body = await r.text().catch(() => '')
    throw new Error(`${label}: HTTP ${r.status} — ${body.substring(0, 300)}`)
  }
  const xml = await r.text()
  console.log(`  Got ${(xml.length / 1024).toFixed(0)} KB`)
  return xml
}

// ── MAIN ─────────────────────────────────────────────────────────
async function main() {
  const now = new Date().toISOString()

  // ═══════════════════════════════════════════════════════════════
  // PART 1: OECD CPI
  // ═══════════════════════════════════════════════════════════════
  console.log('\n=== OECD CPI (Food Inflation) ===\n')

  const allCpiRows = []

  // Batch 1: CP01 with GY (direct YoY %)
  const cp01Gy = CPI_COUNTRIES.filter((c) => c.strategy === 'cp01_gy')
  try {
    const refs = cp01Gy.map((c) => c.code).join('+')
    const url = `https://sdmx.oecd.org/public/rest/data/OECD.SDD.TPS,DSD_PRICES@DF_PRICES_ALL,1.0/${refs}.M.N.CPI.PA.CP01.N.GY.../all?lastNObservations=${FETCH_MONTHS}&dimensionAtObservation=AllDimensions`
    const xml = await fetchSdmx(url, `CP01 GY (${cp01Gy.map(c => c.code).join(', ')})`)
    const obs = parseSdmxXml(xml)
    console.log(`  Parsed ${obs.length} observations`)
    for (const o of obs) {
      const meta = cp01Gy.find((c) => c.code === o.country)
      if (!meta) continue
      allCpiRows.push({
        country_code: o.country,
        country_name: meta.name,
        period: o.period,
        value: parseFloat(Number(o.value).toFixed(2)),
        is_headline_fallback: false,
        fetched_at: now,
      })
    }
  } catch (err) {
    console.error(`  ERROR cp01_gy: ${err.message}`)
  }

  // Batch 2: CP01 with IX (index) → compute YoY
  const cp01Ix = CPI_COUNTRIES.filter((c) => c.strategy === 'cp01_ix')
  try {
    const refs = cp01Ix.map((c) => c.code).join('+')
    const url = `https://sdmx.oecd.org/public/rest/data/OECD.SDD.TPS,DSD_PRICES@DF_PRICES_ALL,1.0/${refs}.M.N.CPI.IX.CP01.N._Z.../all?lastNObservations=${FETCH_MONTHS}&dimensionAtObservation=AllDimensions`
    const xml = await fetchSdmx(url, `CP01 IX (${cp01Ix.map(c => c.code).join(', ')})`)
    const rawObs = parseSdmxXml(xml)
    console.log(`  Parsed ${rawObs.length} raw index observations`)
    const yoyObs = computeYoyFromIndex(rawObs)
    console.log(`  Computed ${yoyObs.length} YoY values`)
    for (const o of yoyObs) {
      const meta = cp01Ix.find((c) => c.code === o.country)
      if (!meta) continue
      allCpiRows.push({
        country_code: o.country,
        country_name: meta.name,
        period: o.period,
        value: o.value,
        is_headline_fallback: false,
        fetched_at: now,
      })
    }
  } catch (err) {
    console.error(`  ERROR cp01_ix: ${err.message}`)
  }

  // Batch 3: Headline fallback
  const headlineBatch = CPI_COUNTRIES.filter((c) => c.strategy === 'headline')
  try {
    const refs = headlineBatch.map((c) => c.code).join('+')
    const url = `https://sdmx.oecd.org/public/rest/data/OECD.SDD.TPS,DSD_PRICES@DF_PRICES_ALL,1.0/${refs}.M.N.CPI.PA._T.N.GY.../all?lastNObservations=${FETCH_MONTHS}&dimensionAtObservation=AllDimensions`
    const xml = await fetchSdmx(url, `Headline GY (${headlineBatch.map(c => c.code).join(', ')})`)
    const obs = parseSdmxXml(xml)
    console.log(`  Parsed ${obs.length} observations`)
    for (const o of obs) {
      const meta = headlineBatch.find((c) => c.code === o.country)
      if (!meta) continue
      allCpiRows.push({
        country_code: o.country,
        country_name: meta.name,
        period: o.period,
        value: parseFloat(Number(o.value).toFixed(2)),
        is_headline_fallback: true,
        fetched_at: now,
      })
    }
  } catch (err) {
    console.error(`  ERROR headline: ${err.message}`)
  }

  // Trim to last 24 months per country
  const byCountry = {}
  for (const row of allCpiRows) {
    if (!byCountry[row.country_code]) byCountry[row.country_code] = []
    byCountry[row.country_code].push(row)
  }
  const trimmedCpi = []
  console.log('\n  Summary per country:')
  for (const [code, rows] of Object.entries(byCountry)) {
    rows.sort((a, b) => a.period.localeCompare(b.period))
    const sliced = rows.slice(-24)
    trimmedCpi.push(...sliced)
    const latest = sliced[sliced.length - 1]
    console.log(`    ${code.padEnd(12)} ${sliced.length} months | latest: ${latest?.period} = ${latest?.value}%${latest?.is_headline_fallback ? ' (headline fallback)' : ''}`)
  }

  console.log(`\n  Total CPI rows to upsert: ${trimmedCpi.length}`)

  if (trimmedCpi.length > 0) {
    const { error } = await supabase
      .from('inflation_oecd')
      .upsert(trimmedCpi, { onConflict: 'country_code,period' })
    if (error) {
      console.error(`  UPSERT ERROR: ${error.message}`)
    } else {
      console.log(`  Upserted ${trimmedCpi.length} rows into inflation_oecd: OK`)
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PART 2: Consumer Barometer
  // ═══════════════════════════════════════════════════════════════
  console.log('\n=== OECD Consumer Barometer ===\n')

  try {
    const refs = BARO_COUNTRIES.map((c) => c.code).join('+')
    const url = `https://sdmx.oecd.org/public/rest/data/OECD.SDD.STES,DSD_STES@DF_CSBAR,4.0/${refs}.M......./all?lastNObservations=${FETCH_MONTHS}&dimensionAtObservation=AllDimensions`
    const xml = await fetchSdmx(url, 'Consumer Barometer')
    const obs = parseSdmxXml(xml)
    console.log(`  Parsed ${obs.length} observations`)

    const countryMap = Object.fromEntries(BARO_COUNTRIES.map((c) => [c.code, c.name]))
    const baroRows = obs
      .filter((o) => countryMap[o.country])
      .map((o) => ({
        country_code: o.country,
        country_name: countryMap[o.country],
        period: o.period,
        indicator: o.indicator || 'CCICP',
        value: parseFloat(Number(o.value).toFixed(4)),
        fetched_at: now,
      }))

    // Summary
    const baroByCo = {}
    for (const r of baroRows) {
      if (!baroByCo[r.country_code]) baroByCo[r.country_code] = []
      baroByCo[r.country_code].push(r)
    }
    console.log('\n  Summary per country:')
    for (const [code, rows] of Object.entries(baroByCo)) {
      rows.sort((a, b) => a.period.localeCompare(b.period))
      const latest = rows[rows.length - 1]
      console.log(`    ${code.padEnd(12)} ${rows.length} months | latest: ${latest?.period} = ${latest?.value}`)
    }

    console.log(`\n  Total barometer rows to upsert: ${baroRows.length}`)

    if (baroRows.length > 0) {
      const { error } = await supabase
        .from('consumer_barometer')
        .upsert(baroRows, { onConflict: 'country_code,indicator,period' })
      if (error) {
        console.error(`  UPSERT ERROR: ${error.message}`)
      } else {
        console.log(`  Upserted ${baroRows.length} rows into consumer_barometer: OK`)
      }
    }
  } catch (err) {
    console.error(`  ERROR barometer: ${err.message}`)
  }

  console.log('\n=== Done ===\n')
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
