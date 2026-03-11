import DataCard from '../DataCard'
import LineChartWrapper from '../LineChart'

const EXPLAINER =
  'Freight cost proxies via Yahoo Finance. ' +
  'BDRY is a US-listed ETF tracking the Baltic Dry Index — the benchmark for dry bulk shipping (grain, coal, iron ore). ' +
  'ZIM is an Israeli container shipping company; its share price correlates strongly with global container freight rates. ' +
  'Both are equity prices, not freight rate indices — use for directional trend only.'

export default function Shipping({ bdry, zim }) {
  const bdryHistory = bdry?.history ?? []
  const zimHistory  = zim?.history  ?? []

  return (
    <section id="shipping" className="mb-14">
      <div className="mb-2">
        <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>
          05 —
        </span>
        <h2 className="inline ml-2" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
          Shipping &amp; Freight
        </h2>
      </div>
      <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 20, lineHeight: 1.6 }}>
        {EXPLAINER}
      </p>

      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <DataCard
          title="Dry Bulk Freight — BDRY ETF"
          value={bdry?.price}
          pctChange={bdry?.pctChange}
          decimals={2}
          unit=" $"
          subLabel="ETF tracking the Baltic Dry Index (BDI) · USD share price · 30-day daily closes"
          loading={bdry?.loading}
          error={bdry?.error}
          inverse={false}
          asOf={bdryHistory.slice(-1)[0]?.date ?? null}
          fromCache={bdry?.fromCache}
          cacheAge={bdry?.cacheAge}
          baseDate={bdry?.baseDate}
        />
        <DataCard
          title="Container Freight Proxy — ZIM"
          value={zim?.price}
          pctChange={zim?.pctChange}
          decimals={2}
          unit=" $"
          subLabel="ZIM Integrated Shipping (NYSE) · USD share price · container rate proxy"
          loading={zim?.loading}
          error={zim?.error}
          inverse={false}
          asOf={zimHistory.slice(-1)[0]?.date ?? null}
          fromCache={zim?.fromCache}
          cacheAge={zim?.cacheAge}
          baseDate={zim?.baseDate}
        />
      </div>

      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {bdryHistory.length > 0 && (
          <div className="card" style={{ padding: '16px 16px 8px' }}>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>
              BDRY (Baltic Dry ETF) · 30 days · USD
            </p>
            <LineChartWrapper
              data={bdryHistory}
              lines={[{ key: 'close', color: 'var(--shipping)', label: 'BDRY $' }]}
              xKey="date"
              yUnit=" $"
              height={160}
            />
          </div>
        )}
        {zimHistory.length > 0 && (
          <div className="card" style={{ padding: '16px 16px 8px' }}>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>
              ZIM (Container Proxy) · 30 days · USD
            </p>
            <LineChartWrapper
              data={zimHistory}
              lines={[{ key: 'close', color: 'var(--shipping)', label: 'ZIM $' }]}
              xKey="date"
              yUnit=" $"
              height={160}
            />
          </div>
        )}
      </div>

      <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
        Note: BDRY and ZIM are exchange-traded equities — their prices correlate with shipping rate indices but are not the indices themselves.
      </p>

      <div
        className="mt-4 px-4 py-3 rounded-xl"
        style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderLeft: '3px solid var(--shipping)', fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}
      >
        <strong>Why tracked:</strong>{' '}
        Shipping costs affect the movement of bulk crops and food products between regions.
      </div>
    </section>
  )
}
