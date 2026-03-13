import { createClient } from '@supabase/supabase-js'

/**
 * /api/barometer — Read endpoint for Consumer Barometer.
 * Returns latest 12 months per country from consumer_barometer table.
 * No external API calls — Supabase only.
 */

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('consumer_barometer')
      .select('country_code, country_name, period, indicator, value')
      .order('period', { ascending: true })

    if (error) throw new Error(`Supabase read: ${error.message}`)

    const byCountry = {}
    for (const row of data ?? []) {
      if (!byCountry[row.country_code]) {
        byCountry[row.country_code] = {
          country_code: row.country_code,
          country_name: row.country_name,
          data: [],
        }
      }
      byCountry[row.country_code].data.push({
        period: row.period,
        indicator: row.indicator,
        value: row.value,
      })
    }

    const countries = Object.values(byCountry).map((c) => ({
      ...c,
      data: c.data.slice(-12),
    }))

    return res.status(200).json({ status: 'ok', countries })
  } catch (err) {
    console.error('barometer read error:', err)
    return res.status(500).json({ status: 'error', message: err.message })
  }
}
