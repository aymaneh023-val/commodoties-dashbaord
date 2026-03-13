import { getSupabase } from './_shared/dataHelpers.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('commodity_timeseries')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (error) throw error

    return res.status(200).json({ lastRefreshed: data?.updated_at ?? null })
  } catch (err) {
    return res.status(500).json({ lastRefreshed: null, error: err.message })
  }
}
