import { useState } from 'react'
import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts'
import { timeAgo } from '../utils/formatters'

const SOURCE_CONFIG = {
  'reuters':            { label: 'Reuters',    color: '#f59e0b' },
  'associated-press':   { label: 'AP',         color: '#6366f1' },
  'bbc-news':           { label: 'BBC',        color: '#ef4444' },
  'financial-times':    { label: 'FT',         color: '#f97316' },
  'al-jazeera-english': { label: 'Al Jazeera', color: '#10b981' },
  'the-wall-street-journal': { label: 'WSJ',   color: '#3b82f6' },
  'bloomberg':          { label: 'Bloomberg',  color: '#7c3aed' },
}

const CATEGORY_COLORS = {
  oil: 'var(--oil)',
  gas: 'var(--gas)',
  shipping: 'var(--shipping)',
  fertilizer: 'var(--fertilizer)',
  inflation: 'var(--inflation)',
  ALL: 'var(--muted)',
}

const getCategory = (article) => {
  const text = (
    article.title + ' ' + (article.description || '')
  ).toLowerCase()

  if (text.match(/food|wheat|grain|soy|crop|fertilizer|agricultural|fao|hunger|harvest/))
    return { label: 'Food', color: 'var(--food)', id: 'fertilizer' }
  if (text.match(/ship|freight|container|port|vessel|cargo|logistics|red sea|hormuz/))
    return { label: 'Shipping', color: 'var(--shipping)', id: 'shipping' }
  if (text.match(/gas|lng|ttf|pipeline|energy|electricity|power/))
    return { label: 'Gas/Energy', color: 'var(--gas)', id: 'gas' }
  if (text.match(/oil|brent|wti|crude|opec|barrel/))
    return { label: 'Oil', color: 'var(--oil)', id: 'oil' }
  if (text.match(/inflation|cpi|hicp|prices|cost of living/))
    return { label: 'Inflation', color: 'var(--inflation)', id: 'inflation' }
  return { label: 'Markets', color: 'var(--muted)', id: 'ALL' }
}

export default function NewsFeed({ articles, loading, error, activeFilter, sparkline = [] }) {
  const [showCount, setShowCount] = useState(20)

  const enriched = articles.map((a) => ({ ...a, _cat: getCategory(a) }))

  const filtered = activeFilter === 'ALL'
    ? enriched
    : enriched.filter((a) => a._cat.id === activeFilter || a.category === activeFilter)

  return (
    <aside
      className="news-feed-scroll"
      style={{
        position: 'sticky',
        top: '145px',
        maxHeight: 'calc(100vh - 160px)',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div className="mb-4">
        <h2
          className="text-base font-bold"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Market News
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
          Sources: Reuters · AP · BBC · FT · Al Jazeera · WSJ · Bloomberg
        </p>
        <p
          className="text-xs mt-0.5"
          style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, opacity: 0.7 }}
        >
          ⚠ Free plan: articles up to 24h delayed
        </p>
      </div>

      {/* GDELT media attention sparkline */}
      {sparkline.length > 0 && (
        <div className="mb-4">
          <p style={{ fontSize: 10, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 4, opacity: 0.7 }}>
            Media attention — 30d
          </p>
          <ResponsiveContainer width="100%" height={48}>
            <LineChart data={sparkline} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--muted)"
                strokeWidth={1}
                dot={false}
                activeDot={{ r: 2, strokeWidth: 0, fill: 'var(--muted)' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0]?.payload
                  return (
                    <div
                      style={{
                        background: 'var(--surface2)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        padding: '4px 8px',
                        fontSize: 10,
                        fontFamily: "'DM Mono', monospace",
                        color: 'var(--muted)',
                      }}
                    >
                      {d?.value != null ? `${Number(d.value).toFixed(0)} articles/15min` : '—'}
                      {d?.date ? ` · ${d.date}` : ''}
                    </div>
                  )
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* States */}
      {loading && !articles.length && (
        <div className="flex items-center gap-2 py-6" style={{ color: 'var(--muted)', fontSize: 12 }}>
          <span className="spinner" />
          Loading latest news…
        </div>
      )}

      {error && (
        <div
          className="rounded-lg p-4 text-xs"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-xs py-4" style={{ color: 'var(--muted)' }}>
          No articles match the current filter.
        </div>
      )}

      {/* Articles — show 20, load more reveals next 10 */}
      <div className="flex flex-col gap-3">
        {filtered.slice(0, showCount).map((article, i) => (
          <ArticleCard key={`${article.url}-${i}`} article={article} />
        ))}
      </div>

      {filtered.length > showCount && (
        <button
          onClick={() => setShowCount((c) => c + 10)}
          className="w-full mt-3 py-2 rounded-lg text-xs transition-colors"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--muted)',
            fontFamily: "'DM Mono', monospace",
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)' }}
        >
          Load more ({filtered.length - showCount} remaining)
        </button>
      )}
    </aside>
  )
}

function ArticleCard({ article }) {
  const sourceId = article.source?.id || ''
  const src = SOURCE_CONFIG[sourceId] || { label: article.source?.name || 'Source', color: '#6b7fa3' }
  const cat = article._cat || getCategory(article)

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl p-4 transition-all"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        textDecoration: 'none',
        color: 'inherit',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)' }}
    >
      {/* Top badges row */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span
          className="text-xs px-2 py-0.5 rounded font-medium"
          style={{
            color: src.color,
            background: `${src.color}18`,
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
          }}
        >
          {src.label}
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{
            color: cat.color,
            background: `color-mix(in srgb, ${cat.color === 'var(--muted)' ? '#6b7280' : cat.color} 10%, transparent)`,
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
          }}
        >
          {cat.label}
        </span>
        <span
          className="text-xs ml-auto"
          style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10 }}
        >
          {timeAgo(article.publishedAt)}
        </span>
      </div>

      {/* Headline */}
      <p
        className="leading-snug mb-1 font-medium"
        style={{ fontFamily: "'Syne', sans-serif", color: 'var(--text)', fontSize: 13 }}
      >
        {article.title}
      </p>

      {/* Description */}
      {article.description && (
        <p
          className="text-xs leading-relaxed line-clamp-2"
          style={{ color: 'var(--muted)' }}
        >
          {article.description}
        </p>
      )}
    </a>
  )
}
