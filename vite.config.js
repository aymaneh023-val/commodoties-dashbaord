import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Local dev API plugin — serves /api/timeseries by querying Supabase directly
function localApiPlugin() {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/timeseries') && !req.url.startsWith('/api/inflation') && !req.url.startsWith('/api/barometer') && !req.url.startsWith('/api/last-refreshed')) return next()

        try {
          const { createClient } = await import('@supabase/supabase-js')
          const { default: dotenv } = await import('dotenv')
          dotenv.config()

          const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

          // /api/last-refreshed — return most recent updated_at
          if (req.url.startsWith('/api/last-refreshed')) {
            const { data } = await sb
              .from('commodity_timeseries')
              .select('updated_at')
              .order('updated_at', { ascending: false })
              .limit(1)
              .single()

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ lastRefreshed: data?.updated_at ?? null }))
            return
          }

          // /api/inflation — read from inflation_oecd
          if (req.url.startsWith('/api/inflation')) {
            const { data, error } = await sb
              .from('inflation_oecd')
              .select('country_code, country_name, period, value, is_headline_fallback')
              .order('period', { ascending: true })
            if (error) throw error

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
              byCountry[row.country_code].data.push({ period: row.period, value: row.value })
            }
            const countries = Object.values(byCountry).map((c) => ({
              ...c,
              data: c.data.slice(-12),
            }))

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ status: 'ok', countries }))
            return
          }

          // /api/barometer — read from consumer_barometer
          if (req.url.startsWith('/api/barometer')) {
            const { data, error } = await sb
              .from('consumer_barometer')
              .select('country_code, country_name, period, indicator, value')
              .order('period', { ascending: true })
            if (error) throw error

            const byCountry = {}
            for (const row of data ?? []) {
              if (!byCountry[row.country_code]) {
                byCountry[row.country_code] = {
                  country_code: row.country_code,
                  country_name: row.country_name,
                  data: [],
                }
              }
              byCountry[row.country_code].data.push({ period: row.period, indicator: row.indicator, value: row.value })
            }
            const countries = Object.values(byCountry).map((c) => ({
              ...c,
              data: c.data.slice(-12),
            }))

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ status: 'ok', countries }))
            return
          }

          // /api/timeseries
          const url = new URL(req.url, 'http://localhost')
          const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '90', 10), 1), 365)
          const since = new Date()
          since.setDate(since.getDate() - days)

          const { data, error } = await sb
            .from('commodity_timeseries_all')
            .select('symbol, date, open, high, low, close')
            .gte('date', since.toISOString().split('T')[0])
            .order('date', { ascending: true })

          if (error) throw error

          const grouped = {}
          for (const row of data ?? []) {
            if (!grouped[row.symbol]) grouped[row.symbol] = []
            grouped[row.symbol].push({ date: row.date, open: row.open, high: row.high, low: row.low, close: row.close })
          }

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ status: 'ok', data: grouped }))
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ status: 'error', message: err.message }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), localApiPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          recharts: ['recharts'],
        },
      },
    },
  },
})
