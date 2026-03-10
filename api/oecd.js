export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // 15 months back so we can compute MoM for 13+ periods
  const d = new Date()
  d.setMonth(d.getMonth() - 15)
  const sp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

  const url =
    `https://sdmx.oecd.org/public/rest/data/` +
    `OECD.SDD.TPS,DSD_PRICES@DF_PRICES_ALL/` +
    `USA+GBR+CHN.M.N.CPI.IX.CP01.N._Z` +
    `?format=csvfilewithlabels&startPeriod=${sp}`

  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'EU-Energy-Monitor/1.0', Accept: 'text/csv' },
      signal: AbortSignal.timeout(15000),
    })
    if (!r.ok) throw new Error(`OECD: ${r.status}`)

    const csv = await r.text()
    const lines = csv.split('\n').filter(Boolean)
    if (lines.length < 2) throw new Error('Empty OECD response')

    // Parse headers (may be quoted)
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
    const refIdx  = headers.findIndex(h => h === 'REF_AREA')
    const timeIdx = headers.findIndex(h => h === 'TIME_PERIOD')
    const valIdx  = headers.findIndex(h => h === 'OBS_VALUE')

    if (refIdx === -1 || timeIdx === -1 || valIdx === -1) {
      throw new Error(`Missing columns. Found: ${headers.join(', ')}`)
    }

    const byCountry = { USA: [], GBR: [], CHN: [] }

    for (let i = 1; i < lines.length; i++) {
      // simple CSV split (no embedded commas expected in these fields)
      const cells = lines[i].split(',').map(c => c.replace(/"/g, '').trim())
      const country = cells[refIdx]
      if (!byCountry[country]) continue
      const period = cells[timeIdx]
      const value = parseFloat(cells[valIdx])
      if (period && !isNaN(value)) byCountry[country].push({ period, value })
    }

    // Compute MoM % from index values
    const toMoM = (arr) =>
      arr.map((d, i) => {
        if (i === 0) return { period: d.period, value: null }
        const prev = arr[i - 1].value
        return { period: d.period, value: prev ? ((d.value - prev) / prev) * 100 : null }
      }).filter(d => d.value != null)

    return res.status(200).json({
      status: 'ok',
      data: {
        USA: toMoM(byCountry.USA),
        GBR: toMoM(byCountry.GBR),
        CHN: toMoM(byCountry.CHN),
      },
    })
  } catch (err) {
    console.error('OECD proxy error:', err.message)
    return res.status(502).json({ status: 'error', message: err.message })
  }
}
