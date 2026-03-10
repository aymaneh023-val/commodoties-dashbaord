import { read, utils } from 'xlsx'

const GPR_URL = 'https://www.matteoiacoviello.com/gpr_files/data_gpr_export_202503.xls'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const r = await fetch(GPR_URL, {
      headers: { 'User-Agent': 'EU-Energy-Monitor/1.0' },
      signal: AbortSignal.timeout(15000),
    })
    if (!r.ok) throw new Error(`GPR fetch error: ${r.status}`)

    const buf = Buffer.from(await r.arrayBuffer())
    const wb = read(buf, { type: 'buffer' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const rows = utils.sheet_to_json(sheet, { header: 1, defval: null })

    if (!rows.length) throw new Error('Empty workbook')

    const headers = rows[0].map(h => (h ?? '').toString().trim())
    const gprcIdx = headers.findIndex(h => h === 'GPRC')
    const dateIdx = 0

    if (gprcIdx === -1) {
      // Fallback: try any column with "GPR" in name
      const fallback = headers.findIndex(h => h.includes('GPR'))
      if (fallback === -1) throw new Error(`GPRC column not found. Headers: ${headers.join(', ')}`)
    }

    const colIdx = gprcIdx !== -1 ? gprcIdx : headers.findIndex(h => h.includes('GPR'))

    const data = rows
      .slice(1)
      .filter(row => row[colIdx] != null && row[dateIdx] != null)
      .slice(-13)
      .map(row => ({
        period: String(row[dateIdx]),
        value: parseFloat(row[colIdx]),
      }))
      .filter(d => !isNaN(d.value))

    return res.status(200).json({ status: 'ok', data })
  } catch (err) {
    console.error('GPR fetch error:', err.message)
    return res.status(502).json({ status: 'error', message: err.message })
  }
}
