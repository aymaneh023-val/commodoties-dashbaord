import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const sb = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function inspect() {
  // Check existing tables by probing them
  const tables = ['prices', 'inflation_cache', 'news_articles', 'commodity_timeseries']
  
  for (const t of tables) {
    const { status, count, error } = await sb
      .from(t)
      .select('*', { count: 'exact', head: true })
    console.log(`${t}: status=${status} count=${count} error=${error?.message || 'none'}`)
  }

  // Sample data from prices table
  const { data: pricesSample } = await sb
    .from('prices')
    .select('*')
    .limit(5)
  console.log('\nPrices sample:', JSON.stringify(pricesSample, null, 2))

  // Check prices table columns
  const { data: pricesAll } = await sb
    .from('prices')
    .select('*')
    .limit(1)
  if (pricesAll?.[0]) {
    console.log('\nPrices columns:', Object.keys(pricesAll[0]))
  }
}

inspect().catch(console.error)
