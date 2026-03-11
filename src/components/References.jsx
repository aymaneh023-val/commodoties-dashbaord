const SECTIONS = [
  {
    title: 'CRUDE OIL',
    sources: [
      {
        name: 'ICE Brent Futures (BZ=F)',
        provider: 'Yahoo Finance',
        url: 'https://finance.yahoo.com/quote/BZ=F',
        desc: 'ICE Brent crude futures, 15-min delayed',
      },
    ],
  },
  {
    title: 'EUROPEAN GAS',
    sources: [
      {
        name: 'TTF Natural Gas Futures (TTF=F)',
        provider: 'Yahoo Finance',
        url: 'https://finance.yahoo.com/quote/TTF=F',
        desc: 'Dutch TTF gas futures, EU benchmark',
      },
    ],
  },
  {
    title: 'SHIPPING',
    sources: [
      {
        name: 'Breakwave Dry Bulk ETF (BDRY)',
        provider: 'Yahoo Finance',
        url: 'https://finance.yahoo.com/quote/BDRY',
        desc: 'Baltic Dry Index proxy ETF',
      },
      {
        name: 'ZIM Integrated Shipping (ZIM)',
        provider: 'Yahoo Finance',
        url: 'https://finance.yahoo.com/quote/ZIM',
        desc: 'Container freight rate proxy, NYSE',
      },
    ],
  },
  {
    title: 'FERTILIZER',
    sources: [
      {
        name: 'Urea Futures (UFB=F)',
        provider: 'Yahoo Finance',
        url: 'https://finance.yahoo.com/quote/UFB=F',
        desc: 'Urea futures — nitrogen fertilizer benchmark, CME listed',
      },
      {
        name: 'IMF Fertilizer Price Index (PFERT)',
        provider: 'IMF Primary Commodity Prices',
        url: 'https://imfstatapi.imf.org/v1/data/PCPS/M.W00.PFERT.IX',
        desc: 'IMF global fertilizer price index (2016=100). Monthly data via IMF SDMX-JSON API.',
      },
    ],
  },
  {
    title: 'FOOD COMMODITIES',
    sources: [
      {
        name: 'Wheat Futures (ZW=F)',
        provider: 'Yahoo Finance',
        url: 'https://finance.yahoo.com/quote/ZW=F',
        desc: 'CBOT soft red winter wheat futures, $/bushel',
      },
      {
        name: 'Corn Futures (ZC=F)',
        provider: 'Yahoo Finance',
        url: 'https://finance.yahoo.com/quote/ZC=F',
        desc: 'CBOT corn futures, $/bushel',
      },
      {
        name: 'Soybean Futures (ZS=F)',
        provider: 'Yahoo Finance',
        url: 'https://finance.yahoo.com/quote/ZS=F',
        desc: 'CBOT soybean futures, $/bushel',
      },
      {
        name: 'Soybean Oil Futures (ZL=F)',
        provider: 'Yahoo Finance',
        url: 'https://finance.yahoo.com/quote/ZL=F',
        desc: 'CBOT soybean oil futures, cents/lb',
      },
      {
        name: 'Soybean Meal Futures (ZM=F)',
        provider: 'Yahoo Finance',
        url: 'https://finance.yahoo.com/quote/ZM=F',
        desc: 'CBOT soybean meal futures, $/short ton',
      },
      {
        name: 'Sugar #11 Futures (SB=F)',
        provider: 'Yahoo Finance',
        url: 'https://finance.yahoo.com/quote/SB=F',
        desc: 'ICE raw sugar futures, cents/lb',
      },
      {
        name: 'Crude Palm Oil Futures (FCPO=F)',
        provider: 'Yahoo Finance',
        url: 'https://finance.yahoo.com/quote/FCPO=F',
        desc: 'Bursa Malaysia crude palm oil futures, MYR/tonne',
      },
    ],
  },
  {
    title: 'GEOPOLITICAL RISK',
    sources: [
      {
        name: 'Geopolitical Risk Index (GPR)',
        provider: 'Caldara & Iacoviello (2022)',
        url: 'https://matteoiacoviello.com/gpr.htm',
        desc: 'Monthly index of geopolitical risk based on text analysis of news articles. Caldara, D. and M. Iacoviello, "Measuring Geopolitical Risk," American Economic Review, 2022.',
      },
    ],
  },
  {
    title: 'INFLATION',
    sources: [
      {
        name: 'EA HICP Headline & Food',
        provider: 'Eurostat API',
        url: 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_mmor',
        desc: 'Harmonised Index of Consumer Prices, Euro Area. Monthly data, official EU source.',
      },
      {
        name: 'US, UK, China Food CPI',
        provider: 'OECD SDMX API',
        url: 'https://sdmx.oecd.org/public/rest/data/OECD.SDD.TPS,DSD_PRICES@DF_PRICES_ALL',
        desc: 'Food price index (2015=100) for USA, GBR, CHN. MoM % computed server-side from index values.',
      },
    ],
  },
  {
    title: 'NEWS',
    sources: [
      {
        name: 'NewsAPI',
        provider: 'newsapi.org',
        url: 'https://newsapi.org',
        desc: 'Aggregated headlines from Reuters, AP, BBC, FT, Al Jazeera, WSJ, Bloomberg. Free plan: 24h article delay.',
      },
    ],
  },
]

const METHODOLOGY = `All commodity prices are sourced via Yahoo Finance and are subject to 15-minute delays. Prices are fetched on page load and on manual refresh only — no automatic polling.

Percentage changes shown as '% vs 30d ago' are calculated using the first available data point in the 30-day history window as the base value.

HICP inflation data is sourced directly from Eurostat's dissemination API. Data is monthly and may lag by 4-6 weeks from the current date. OECD food CPI data (US, UK, China) is fetched via a serverless proxy and MoM % is computed from index values (2015=100).

The IMF Fertilizer Price Index (PFERT) is fetched directly from the IMF SDMX-JSON API. Static fallback data is used if the API is unavailable.

The Geopolitical Risk Index (GPR) is sourced from the Excel file published by Caldara & Iacoviello (2022). It is parsed server-side via a Vercel serverless function. Thresholds: >200 CRITICAL, >150 ELEVATED, >100 MODERATE, ≤100 NORMAL.

The food commodities comparison chart normalises all metrics to a 0-100% scale using min-max normalisation over the 30-day window.

The comparison chart normalises all metrics to a 0-100% scale using min-max normalisation over the 30-day window. This allows visual comparison of metrics with different units but does not imply any direct causal relationship between them.

This dashboard is for informational and analytical purposes only. It does not constitute financial, investment, or policy advice.`

export default function References({ onBack }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px 96px' }}>
        {/* Back link */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs mb-8 transition-colors"
          style={{
            color: 'var(--muted)',
            fontFamily: "'DM Mono', monospace",
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)' }}
        >
          ← Back to dashboard
        </button>

        {/* Title */}
        <h1
          className="text-xl font-bold mb-1"
          style={{ fontFamily: "'Syne', sans-serif", color: 'var(--text)' }}
        >
          Data Sources &amp; Methodology
        </h1>
        <p className="text-sm mb-12" style={{ color: 'var(--muted)' }}>
          All data sources used in this dashboard, with direct links to primary sources.
        </p>

        {/* Source sections */}
        {SECTIONS.map((section) => (
          <div key={section.title} className="mb-10">
            <h3
              className="uppercase tracking-widest mb-6"
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                color: 'var(--muted)',
                letterSpacing: '0.15em',
              }}
            >
              ── {section.title} ──
            </h3>
            <div className="flex flex-col" style={{ gap: 32 }}>
              {section.sources.map((source) => (
                <div key={source.name}>
                  <p
                    className="font-medium mb-1"
                    style={{ fontSize: 13, color: 'var(--text)' }}
                  >
                    {source.name}
                  </p>
                  <p className="mb-1" style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {source.provider} ·{' '}
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--muted)',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline' }}
                      onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none' }}
                    >
                      {source.url.replace('https://', '')}
                    </a>
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--muted)', opacity: 0.7 }}>
                    {source.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Methodology */}
        <div className="mt-12">
          <h3
            className="uppercase tracking-widest mb-6"
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: 'var(--muted)',
              letterSpacing: '0.15em',
            }}
          >
            ── METHODOLOGY ──
          </h3>
          <div
            style={{
              background: 'var(--surface2)',
              padding: 24,
              borderRadius: 12,
              fontSize: 13,
              lineHeight: 1.8,
              color: 'var(--muted)',
              whiteSpace: 'pre-line',
            }}
          >
            {METHODOLOGY}
          </div>
        </div>
      </div>
    </div>
  )
}
