import { useState } from 'react'

const CHOKEPOINTS = [
  {
    id: 'hormuz',
    name: 'Strait of Hormuz',
    lng: 56.5,
    lat: 26.5,
    status: 'CONSTRAINED',
    note: 'Handles ~21% of global oil and 20% of LNG. A closure would add 14–21 days via Cape of Good Hope detour.',
  },
  {
    id: 'bab',
    name: 'Bab-el-Mandeb',
    lng: 43.4,
    lat: 12.6,
    status: 'REDUCED',
    note: '~90% of Asia-EU container traffic rerouted via Africa since late 2023. Adds $2,000–4,000/container and 10–14 days.',
  },
  {
    id: 'suez',
    name: 'Suez Canal',
    lng: 32.5,
    lat: 30.0,
    status: 'NORMAL',
    note: '12% of global trade passes through here. Transit volumes down ~50% since late 2023. Egypt losing ~$7bn/year in transit fees.',
  },
  {
    id: 'persian',
    name: 'Persian Gulf Lanes',
    lng: 50.5,
    lat: 26.0,
    status: 'ELEVATED',
    note: 'Primary export corridor for Gulf-state oil. Maritime insurance premiums elevated, up ~300% year-over-year.',
  },
]

const STATUS_CONFIG = {
  CONSTRAINED: { color: '#f87171', size: 12, pulse: false, emoji: '●' },
  REDUCED:     { color: '#f59e0b', size: 10, pulse: false, emoji: '●' },
  ELEVATED:    { color: '#818cf8', size: 10, pulse: false, emoji: '●' },
  NORMAL:      { color: '#6b7280', size: 8,  pulse: false, emoji: '●' },
}

// SVG viewBox: longitude 25E–65E, latitude 5N–35N
// Map longitude/latitude to SVG coordinates
const mapX = (lng) => ((lng - 25) / 40) * 800
const mapY = (lat) => ((35 - lat) / 30) * 600

// Simplified coastline polygons (SVG paths)
const COASTLINES = [
  // Arabian Peninsula
  'M' + [
    [39, 30], [40, 28.5], [41.5, 27.5], [43.5, 27.2],
    [44.5, 26.5], [46, 26.5], [47, 25.5], [50, 25.5],
    [51.5, 24], [52, 23], [53, 22.8], [55, 22.5],
    [56, 22.2], [56.5, 22.5], [57, 23], [57.3, 23.5],
    [58, 23.5], [59, 22.5], [59.5, 22.8], [59, 24],
    [57.5, 25], [56.5, 26], [56.3, 26.5], [56, 27],
    [51, 27.5], [50.5, 28.5], [50.2, 29], [49, 29.5],
    [48, 29.5], [48, 30], [47, 30.5], [44, 29.5],
    [43, 28], [41, 27], [39.5, 27.5], [38.5, 27],
    [37, 25.5], [36, 22], [34, 19], [33.5, 18],
    [34, 17], [35, 16], [36, 14.5], [37, 14],
    [38, 13.5], [39, 13], [39.5, 13.5], [40, 13],
    [41, 12.5], [42, 12.8], [43, 12.2], [43.5, 12],
    [43, 11.5], [44, 11], [45, 12.5], [47, 11.5],
    [48.5, 11.5], [49, 11.7], [50, 12], [51, 13],
    [52, 16], [53, 16.5], [55, 20], [55.5, 21],
    [56, 22.2],
  ].map(([lng, lat]) => `${mapX(lng).toFixed(0)},${mapY(lat).toFixed(0)}`).join(' L'),
  // Horn of Africa (Somalia/Djibouti)
  'M' + [
    [41, 12], [42, 11], [43, 11.5], [43.5, 11],
    [44, 11], [45, 11], [46, 10.5], [47, 10],
    [48, 9], [49, 8], [50, 7], [50.5, 6],
    [49, 6.5], [47, 7], [45, 8], [44, 8.5],
    [43, 9], [42, 10], [41, 11], [41, 12],
  ].map(([lng, lat]) => `${mapX(lng).toFixed(0)},${mapY(lat).toFixed(0)}`).join(' L'),
  // Egypt / Sinai
  'M' + [
    [25, 31.5], [28, 31.5], [29, 31], [30, 31.2],
    [31, 31.5], [32, 31.2], [33, 29.5], [34, 28.5],
    [34.5, 28], [34.5, 27.5], [33.5, 27.5], [32.5, 28],
    [32, 29], [31.5, 29.5], [31, 30], [30, 30.5],
    [29, 30.8], [28, 31], [25, 31.5],
  ].map(([lng, lat]) => `${mapX(lng).toFixed(0)},${mapY(lat).toFixed(0)}`).join(' L'),
  // Iran coastline
  'M' + [
    [56, 27], [56.5, 27.2], [57, 27.5], [57.5, 27],
    [58, 26.5], [59, 26.5], [60, 25.5], [61, 25.5],
    [62, 25], [63, 25.5], [65, 25.5], [65, 26],
    [64, 26.5], [63, 27], [61, 27], [60, 27.5],
    [59, 28.5], [57, 28], [56, 27.5], [55, 28],
    [53, 28.5], [52, 29], [51, 29.5], [50.5, 30],
    [49, 30.5], [48, 31], [47, 31.5], [46, 33],
    [45, 33.5], [44, 34], [43, 34.5], [42, 35],
    [40, 35], [38, 35], [36, 35], [34, 35],
    [33, 35], [31, 35],
  ].map(([lng, lat]) => `${mapX(lng).toFixed(0)},${mapY(lat).toFixed(0)}`).join(' L'),
  // East Africa coast (Sudan/Eritrea)
  'M' + [
    [34, 19], [35, 19.5], [36, 18], [37, 17.5],
    [38, 16], [38.5, 15], [39, 14.5], [39.5, 14],
    [40, 13.5], [41, 12],
  ].map(([lng, lat]) => `${mapX(lng).toFixed(0)},${mapY(lat).toFixed(0)}`).join(' L'),
]

// Map PortWatch chokepoint ids to our chokepoint ids
const PORTWATCH_KEY_MAP = {
  hormuz:  ['hormuz', 'strait of hormuz'],
  bab:     ['bab', 'bab-el-mandeb', 'bab el mandeb', 'mandeb'],
  suez:    ['suez'],
  persian: ['persian', 'persian gulf'],
}

function getPortWatchStatus(deviation) {
  if (deviation == null) return null
  if (deviation < -40) return 'CONSTRAINED'
  if (deviation < -25) return 'REDUCED'
  if (deviation < -10) return 'ELEVATED'
  return 'NORMAL'
}

const EXPLAINER = 'Key maritime chokepoints affecting global energy and food supply chains. The Strait of Hormuz alone controls ~21% of global oil supply — a closure would immediately affect European energy and food prices.'

export default function Chokepoints({ portwatch = null }) {
  const [hoveredId, setHoveredId] = useState(null)

  // Merge live PortWatch data into CHOKEPOINTS
  const enrichedChokepoints = CHOKEPOINTS.map((cp) => {
    if (!portwatch) return cp
    // Find PortWatch entry matching this chokepoint
    const pwKeys = PORTWATCH_KEY_MAP[cp.id] || []
    const pwEntry = Object.entries(portwatch).find(([key]) =>
      pwKeys.some((k) => key.toLowerCase().includes(k))
    )
    if (!pwEntry) return cp
    const [, pw] = pwEntry
    const liveStatus = getPortWatchStatus(pw.deviation)
    return {
      ...cp,
      status: liveStatus ?? cp.status,
      vesselCount: pw.vesselCount ?? null,
      deviation: pw.deviation ?? null,
      isLive: true,
    }
  })

  const statusCounts = Object.entries(STATUS_CONFIG).map(([status, cfg]) => ({
    status,
    count: enrichedChokepoints.filter((c) => c.status === status).length,
    emoji: cfg.emoji,
  }))

  return (
    <section id="chokepoints" className="mb-14">
      <div className="mb-2">
        <span
          className="text-xs uppercase tracking-widest"
          style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}
        >
          03.5 —
        </span>
        <h2
          className="text-lg font-bold inline ml-2"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Middle East Chokepoints
        </h2>
      </div>
      <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400, marginBottom: 20 }}>
        {EXPLAINER}
      </p>

      {/* SVG Map */}
      <div
        className="relative"
        style={{
          background: 'var(--surface2)',
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}
      >
        <svg
          viewBox="0 0 800 600"
          width="100%"
          style={{ display: 'block', height: 320 }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Water background */}
          <rect width="800" height="600" fill="var(--surface2)" />

          {/* Coastlines */}
          {COASTLINES.map((path, i) => (
            <path
              key={i}
              d={path}
              fill="var(--surface)"
              stroke="var(--border)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          ))}

          {/* Water labels */}
          <text x={mapX(40)} y={mapY(24)} fill="var(--muted)" fontSize="10" fontFamily="'DM Mono', monospace" opacity="0.4" textAnchor="middle">
            Red Sea
          </text>
          <text x={mapX(52)} y={mapY(25.5)} fill="var(--muted)" fontSize="10" fontFamily="'DM Mono', monospace" opacity="0.4" textAnchor="middle">
            Persian Gulf
          </text>
          <text x={mapX(47)} y={mapY(9)} fill="var(--muted)" fontSize="10" fontFamily="'DM Mono', monospace" opacity="0.4" textAnchor="middle">
            Gulf of Aden
          </text>
          <text x={mapX(60)} y={mapY(20)} fill="var(--muted)" fontSize="10" fontFamily="'DM Mono', monospace" opacity="0.4" textAnchor="middle">
            Arabian Sea
          </text>

          {/* Chokepoint dots */}
          {enrichedChokepoints.map((cp) => {
            const cfg = STATUS_CONFIG[cp.status]
            const cx = mapX(cp.lng)
            const cy = mapY(cp.lat)

            return (
              <g
                key={cp.id}
                onMouseEnter={() => setHoveredId(cp.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Pulsing ring */}
                {cfg.pulse && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={cfg.size}
                    fill="none"
                    stroke={cfg.color}
                    strokeWidth="2"
                    opacity="0.6"
                  >
                    <animate
                      attributeName="r"
                      values={`${cfg.size};${cfg.size * 2.5};${cfg.size}`}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.6;0;0"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Inner solid dot */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={cfg.size / 2}
                  fill={cfg.color}
                />

                {/* Label */}
                <text
                  x={cx + cfg.size + 6}
                  y={cy + 4}
                  fill="var(--text)"
                  fontSize="11"
                  fontFamily="'DM Mono', monospace"
                  fontWeight="500"
                >
                  {cp.name}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Tooltip */}
        {hoveredId && (() => {
          const cp = enrichedChokepoints.find((c) => c.id === hoveredId)
          if (!cp) return null
          const cfg = STATUS_CONFIG[cp.status]
          return (
            <div
              style={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                right: 16,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '12px 16px',
                fontFamily: "'DM Mono', monospace",
                fontSize: 12,
                maxWidth: 360,
                zIndex: 10,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: cfg.color,
                    display: 'inline-block',
                  }}
                />
                <strong style={{ color: 'var(--text)', fontSize: 13 }}>{cp.name}</strong>
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    color: cfg.color,
                    background: `${cfg.color}18`,
                    fontSize: 10,
                  }}
                >
                  {cp.status}
                </span>
                {cp.isLive && (
                  <span style={{ fontSize: 9, color: '#4ade80', fontFamily: "'DM Mono', monospace" }}>LIVE</span>
                )}
              </div>
              {cp.isLive && (cp.vesselCount != null || cp.deviation != null) && (
                <p style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 11, marginBottom: 6 }}>
                  {cp.vesselCount != null ? `${cp.vesselCount} vessels` : ''}
                  {cp.vesselCount != null && cp.deviation != null ? ' · ' : ''}
                  {cp.deviation != null ? `${cp.deviation > 0 ? '+' : ''}${cp.deviation.toFixed(1)}% vs 30d avg` : ''}
                </p>
              )}
              <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>{cp.note}</p>
            </div>
          )
        })()}
      </div>

      {/* Status summary bar */}
      <div className="flex gap-3 mt-4 flex-wrap">
        {statusCounts.map(({ status, count, emoji }) => (
          <div
            key={status}
            className="px-3 py-1.5 rounded-lg text-xs"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              fontFamily: "'DM Mono', monospace",
              color: STATUS_CONFIG[status].color,
            }}
          >
            {emoji} {count} {status.charAt(0) + status.slice(1).toLowerCase()}
          </div>
        ))}
      </div>

      {/* Source note */}
      <p
        className="mt-4 text-xs"
        style={{
          color: 'var(--muted)',
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          opacity: 0.7,
        }}
      >
        {portwatch
          ? 'Source: IMF PortWatch · vessel transit data updated weekly · status derived from 30d deviation'
          : '⚠ Static data · Status reflects March 2026 intelligence assessment · Not a live feed'}
      </p>
    </section>
  )
}
