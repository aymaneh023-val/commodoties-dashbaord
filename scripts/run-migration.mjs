import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const sb = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function check() {
  // Check if computed table exists
  const { status: rawStatus } = await sb
    .from('commodity_timeseries')
    .select('*', { count: 'exact', head: true })
  console.log(`commodity_timeseries: ${rawStatus === 200 ? 'EXISTS' : 'MISSING'}`)

  const { status: compStatus } = await sb
    .from('commodity_timeseries_computed')
    .select('*', { count: 'exact', head: true })
  console.log(`commodity_timeseries_computed: ${compStatus === 200 || compStatus === 204 ? 'EXISTS' : 'MISSING (status=' + compStatus + ')'}`)

  const { status: viewStatus } = await sb
    .from('commodity_timeseries_all')
    .select('*', { count: 'exact', head: true })
  console.log(`commodity_timeseries_all (view): ${viewStatus === 200 || viewStatus === 204 ? 'EXISTS' : 'MISSING (status=' + viewStatus + ')'}`)

  if (compStatus !== 200 && compStatus !== 204) {
    console.log('\n⚠️  You need to run the migration SQL in the Supabase SQL Editor:')
    console.log('   1. Go to: https://supabase.com/dashboard/project/aqvslrnmfkqevkcgidwm/sql/new')
    console.log('   2. Paste the contents of: supabase/migration_001_timeseries.sql')
    console.log('   3. Click "Run"')
    console.log('\n   The CREATE TABLE IF NOT EXISTS is safe — it skips existing tables.')
  } else {
    console.log('\n✅ All tables and views exist. Migration already applied.')
  }
}

check().catch(console.error)
