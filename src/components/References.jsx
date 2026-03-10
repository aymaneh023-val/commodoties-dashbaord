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
      {
        name: 'NYMEX WTI Futures (CL=F)',
        provider: 'Yahoo Finance',
        url: 'https://finance.yahoo.com/quote/CL=F',
        desc: 'NYMEX WTI crude futures, 15-min delayed',
      },
    ],
  },
  {
    title: 'NATURAL GAS & LNG',
    sources: [
      {
        name: 'TTF Natural Gas Futures (TTF=F)',
        provider: 'Yahoo Finance',
        url: 'https://finance.yahoo.com/quote/TTF=F',
        desc: 'Dutch TTF gas futures, EU benchmark',
      },
      {
        name: 'Cheniere Energy (LNG)',
        provider: 'Yahoo Finance',
        url: 'https://finance.yahoo.com/quote/LNG',
        desc: 'LNG equity proxy, NYSE listed',
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
      {
        name: 'Matson Inc. (MATX)',
        provider: 'Yahoo Finance',
        url: 'https://finance.yahoo.com/quote/MATX',
        desc: 'Pacific container carrier, NYSE',
      },
    ],
  },
  {
    title: 'FERTILIZER',
    sources: [
      {
        name: 'Mosaic Company (MOS)',
        provider: 'Yahoo Finance',
        url: 'https://finance.yahoo.com/quote/MOS',
        desc: 'Global fertilizer producer, NYSE',
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
  {
    title: 'CHOKEPOINTS',
    sources: [
      {
        name: 'IEA Oil Market Report — March 2026',
        provider: 'IEA',
        url: 'https://iea.org/reports/oil-market-report-march-2026',
        desc: 'Strait of Hormuz transit volumes',
      },
      {
        name: 'UN Conference on Trade and Development (UNCTAD)',
        provider: 'UNCTAD',
        url: 'https://unctad.org/topic/transport-and-trade-logistics',
        desc: 'Red Sea disruption impact data',
      },
      {
        name: "Lloyd's List Intelligence",
        provider: "Lloyd's List",
        url: 'https://lloydslist.com',
        desc: 'Suez Canal vessel traffic data',
      },
    ],
  },
]

const METHODOLOGY = `All commodity prices are sourced via Yahoo Finance and are subject to 15-minute delays. Prices are fetched on page load and on manual refresh only — no automatic polling.

Percentage changes shown as '% vs 30d ago' are calculated using the first available data point in the 30-day history window as the base value.

HICP inflation data is sourced directly from Eurostat's dissemination API. Data is monthly and may lag by 4-6 weeks from the current date.

The chokepoint map reflects a static assessment as of March 2026 and is not a live feed.

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
              background: 'rgba(245,158,11,0.05)',
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
