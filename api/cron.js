/**
 * /api/cron — single master cron endpoint (Vercel Hobby = 1 cron slot).
 *
 * Runs daily at 18:00 UTC. Calls each refresh job sequentially to stay
 * within the 60-second serverless timeout on Hobby plan.
 *
 * Order of operations:
 * 1. Daily commodity refresh (CommodityPriceAPI + Yahoo + synthetic index)
 * 2. OECD CPI (food inflation for 8 countries)
 * 3. OECD Consumer Barometer (6 countries, store only)
 * 4. News feed (fire-and-forget if tight on time)
 */

const BASE = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

async function callEndpoint(path, label, timeoutMs = 25000) {
  const start = Date.now()
  try {
    const r = await fetch(`${BASE}${path}`, {
      headers: { 'User-Agent': 'CronMaster/1.0' },
      signal: AbortSignal.timeout(timeoutMs),
    })
    const elapsed = Date.now() - start
    const ok = r.ok
    let body = null
    try { body = await r.json() } catch { /* ignore parse errors */ }
    return { label, ok, status: r.status, elapsed, body }
  } catch (err) {
    return { label, ok: false, status: 0, elapsed: Date.now() - start, error: err.message }
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const startTime = Date.now()
  const results = []

  // 1. Daily commodity refresh (most critical)
  results.push(await callEndpoint('/api/daily-refresh', 'daily-refresh'))

  // 2. OECD CPI — food inflation for 8 countries (replaces eurostat/ons/bls)
  results.push(await callEndpoint('/api/oecd-cpi', 'oecd-cpi'))

  // 3. OECD Consumer Barometer — 6 countries, store only
  results.push(await callEndpoint('/api/oecd-barometer', 'oecd-barometer'))

  // 4. News — fire and check, but don't block response if close to timeout
  const elapsed = Date.now() - startTime
  if (elapsed < 45000) {
    results.push(await callEndpoint('/api/news?force=true', 'news', 12000))
  } else {
    // Fire and forget — don't await
    fetch(`${BASE}/api/news?force=true`, {
      headers: { 'User-Agent': 'CronMaster/1.0' },
    }).catch(() => {})
    results.push({ label: 'news', ok: true, status: 0, elapsed: 0, body: 'fire-and-forget' })
  }

  const totalElapsed = Date.now() - startTime
  const allOk = results.every((r) => r.ok)

  return res.status(allOk ? 200 : 207).json({
    status: allOk ? 'ok' : 'partial',
    totalElapsed,
    results,
  })
}
