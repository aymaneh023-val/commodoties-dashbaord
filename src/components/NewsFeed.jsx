import { timeAgo } from '../utils/formatters'

const SOURCE_CONFIG = {
  'reuters':            { label: 'Reuters',    color: '#f59e0b' },
  'associated-press':   { label: 'AP',         color: '#6366f1' },
  'bbc-news':           { label: 'BBC',        color: '#ef4444' },
  'financial-times':    { label: 'FT',         color: '#f97316' },
  'al-jazeera-english': { label: 'Al Jazeera', color: '#10b981' },
}

const CATEGORY_COLORS = {
  oil: 'var(--oil)',
  gas: 'var(--gas)',
  shipping: 'var(--shipping)',
  fertilizer: 'var(--fertilizer)',
  inflation: 'var(--inflation)',
  ALL: 'var(--muted)',
}

export default function NewsFeed({ articles, loading, error, activeFilter }) {
  const filtered = activeFilter === 'ALL'
    ? articles
    : articles.filter((a) => a.category === activeFilter)

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
          Market Intelligence Feed
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
          Sources: Reuters · AP · BBC · FT · Al Jazeera
        </p>
        <p
          className="text-xs mt-0.5"
          style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, opacity: 0.7 }}
        >
          ⚠ Free plan: articles up to 24h delayed
        </p>
      </div>

      {/* States */}
      {loading && !articles.length && (
        <div className="flex items-center gap-2 py-6" style={{ color: 'var(--muted)', fontSize: 12 }}>
          <span className="spinner" />
          Loading latest market intelligence…
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

      {/* Articles — capped at 8 */}
      <div className="flex flex-col gap-3">
        {filtered.slice(0, 8).map((article, i) => (
          <ArticleCard key={`${article.url}-${i}`} article={article} />
        ))}
      </div>
    </aside>
  )
}

function ArticleCard({ article }) {
  const sourceId = article.source?.id || ''
  const src = SOURCE_CONFIG[sourceId] || { label: article.source?.name || 'Source', color: '#6b7fa3' }
  const catColor = CATEGORY_COLORS[article.category] || CATEGORY_COLORS.ALL
  const catLabel = article.category === 'ALL' ? 'General' : article.category.charAt(0).toUpperCase() + article.category.slice(1)

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
            color: catColor,
            background: `${catColor}18`,
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
          }}
        >
          {catLabel}
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
