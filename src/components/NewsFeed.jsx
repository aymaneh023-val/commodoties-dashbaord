import { useState } from 'react'
import { timeAgo } from '../utils/formatters'

const SOURCE_CONFIG = {
  'reuters':            { label: 'Reuters',    color: '#B86E00' },
  'associated-press':   { label: 'AP',         color: '#4A4E99' },
  'bbc-news':           { label: 'BBC',        color: '#C0392B' },
  'financial-times':    { label: 'FT',         color: '#D4622A' },
  'al-jazeera-english': { label: 'Al Jazeera', color: '#2D7A4F' },
  'the-wall-street-journal': { label: 'WSJ',   color: '#3448BF' },
  'bloomberg':          { label: 'Bloomberg',  color: '#6B4EC4' },
}

const getCategory = (article) => {
  const text = (
    article.title + ' ' + (article.description || '')
  ).toLowerCase()

  if (text.match(/food|wheat|grain|soy|crop|agricultural|fao|hunger|harvest|dairy|butter|palm oil/))
    return { label: 'Food', color: 'var(--food)', id: 'food' }
  if (text.match(/fertilizer|urea|phosphate|nitrogen|potash/))
    return { label: 'Fertilizers', color: 'var(--fertilizer)', id: 'fertilizers' }
  if (text.match(/ship|freight|container|port|vessel|cargo|logistics|red sea|hormuz/))
    return { label: 'Shipping', color: 'var(--shipping)', id: 'shipping' }
  if (text.match(/oil|brent|wti|crude|opec|barrel|gas|lng|ttf|pipeline|energy|electricity|power|gold|aluminium|metal/))
    return { label: 'Commodities', color: 'var(--oil)', id: 'commodities' }
  if (text.match(/inflation|cpi|hicp|prices|cost of living|gdp|interest rate|central bank|monetary/))
    return { label: 'Macro', color: 'var(--inflation)', id: 'macro' }
  return { label: 'Markets', color: 'var(--muted)', id: 'ALL' }
}

export default function NewsFeed({ articles, loading, error, activeFilter }) {
  const [showCount, setShowCount] = useState(20)

  const enriched = articles.map((a) => ({ ...a, _cat: getCategory(a) }))

  const filtered = activeFilter === 'ALL'
    ? enriched
    : enriched.filter((a) => a._cat.id === activeFilter || a.category === activeFilter)

  return (
    <aside
      className="news-feed-scroll news-feed-panel"
      style={{
        position: 'sticky',
        top: '145px',
        maxHeight: 'calc(100vh - 160px)',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
          Market News
        </h2>
      </div>

      {/* States */}
      {loading && !articles.length && (
        <div className="flex items-center gap-2 py-6" style={{ color: 'var(--muted)', fontSize: 14 }}>
          <span className="spinner" />
          Loading latest news…
        </div>
      )}

      {error && (
        <div
          className="rounded-lg p-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: 13 }}
        >
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ fontSize: 13, color: 'var(--muted)', paddingTop: 16, paddingBottom: 16 }}>
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
          className="w-full mt-3 py-2 rounded-lg transition-colors"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--muted)',
            fontSize: 13,
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
  const src = SOURCE_CONFIG[sourceId] || { label: article.source?.name || 'Source', color: 'var(--muted)' }
  const cat = article._cat || getCategory(article)

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl p-3 md:p-4 transition-all"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        textDecoration: 'none',
        color: 'inherit',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface2)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)' }}
    >
      {/* Top badges row */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span
          className="px-2 py-0.5 rounded font-medium"
          style={{
            color: src.color,
            background: `${src.color}20`,
            fontSize: 12,
          }}
        >
          {src.label}
        </span>
        <span
          className="px-2 py-0.5 rounded"
          style={{
            color: cat.color,
            background: `${cat.color === 'var(--muted)' ? '#8890B5' : cat.color}20`,
            fontSize: 12,
          }}
        >
          {cat.label}
        </span>
        <span className="ml-auto" style={{ color: 'var(--muted)', fontSize: 12 }}>
          {timeAgo(article.publishedAt)}
        </span>
      </div>

      {/* Content: thumbnail + text */}
      <div className="flex gap-3 items-start">
        {article.urlToImage && (
          <img
            src={article.urlToImage}
            alt=""
            onError={(e) => { e.currentTarget.style.display = 'none' }}
            style={{
              width: 56,
              height: 42,
              objectFit: 'cover',
              borderRadius: 6,
              flexShrink: 0,
            }}
          />
        )}
        <div className="flex-1 min-w-0">
          {/* Headline */}
          <p
            className="leading-snug mb-1 font-medium"
            style={{ color: 'var(--text)', fontSize: 13 }}
          >
            {article.title}
          </p>

          {/* Description */}
          {article.description && (
            <p
              className="leading-relaxed line-clamp-2"
              style={{ color: 'var(--muted)', fontSize: 13 }}
            >
              {article.description}
            </p>
          )}
        </div>
      </div>
    </a>
  )
}
