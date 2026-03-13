import { createClient } from '@supabase/supabase-js'

/**
 * /api/inflation — Read endpoint for the frontend.
 * Returns latest 12 months of OECD food CPI data per country from inflation_oecd.
 * No external API calls — reads from Supabase only.
 *
 * Response shape:
 * {
 *   status: 'ok',
 *   countries: [
 *     {
 *       country_code, country_name, is_headline_fallback,
 *       data: [{ period, value }]
 *     }
 *   ]
 * }
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
      .from('inflation_oecd')
      .select('country_code, country_name, period, value, is_headline_fallback')
      .order('period', { ascending: true })

    if (error) throw new Error(`Supabase read: ${error.message}`)

    // Group by country, keep latest 12 months each
    const byCountry = {}
    for (const row of data ?? []) {
      if (!byCountry[row.country_code]) {
        byCountry[row.country_code] = {
          country_code: row.country_code,
          country_name: row.country_name,
          is_headline_fallback: row.is_headline_fallback,
          data: [],
        }
      }
      byCountry[row.country_code].data.push({
        period: row.period,
        value: row.value,
      })
    }

    // Trim to last 12 months per country
    const countries = Object.values(byCountry).map((c) => ({
      ...c,
      data: c.data.slice(-12),
    }))

    return res.status(200).json({ status: 'ok', countries })
  } catch (err) {
    console.error('inflation read error:', err)
    return res.status(500).json({ status: 'error', message: err.message })
  }
}
