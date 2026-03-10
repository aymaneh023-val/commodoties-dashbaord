import { timeAgo } from '../utils/formatters'
import { SOURCE_COLORS } from '../utils/constants'

const SOURCE_LABEL = {
  reuters: 'Reuters',
  ft: 'FT',
  bloomberg: 'Bloomberg',
  iea: 'IEA',
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
        top: '145px',  // below header + ticker bar
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
          Credible sources · Energy, food supply chain &amp; geopolitics
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

      {/* Articles */}
      <div className="flex flex-col gap-3">
        {filtered.map((article, i) => (
          <ArticleCard key={`${article.url}-${i}`} article={article} />
        ))}
      </div>
    </aside>
  )
}

function ArticleCard({ article }) {
  const sourceKey = article.sourceName?.toLowerCase()
  const sourceColor = SOURCE_COLORS[sourceKey] || SOURCE_COLORS.default
  const sourceLabel = SOURCE_LABEL[sourceKey] || article.sourceName || 'Source'
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
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
    >
      {/* Top badges row */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span
          className="text-xs px-2 py-0.5 rounded font-medium"
          style={{
            color: sourceColor,
            background: `${sourceColor}18`,
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
          }}
        >
          {sourceLabel}
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
        className="text-sm leading-snug mb-1 font-medium"
        style={{ fontFamily: "'Syne', sans-serif", color: 'var(--text)' }}
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
