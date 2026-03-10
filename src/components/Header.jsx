import { useEffect } from 'react'
import { FILTER_TABS } from '../utils/constants'
import { formatTime } from '../utils/formatters'

export default function Header({ activeFilter, onFilterChange, onRefresh, lastUpdated }) {
  // Read initial hash on mount
  useEffect(() => {
    const hash = window.location.hash.replace('#', '').toLowerCase()
    const valid = FILTER_TABS.find((t) => t.id.toLowerCase() === hash)
    if (valid && valid.id !== 'ALL') onFilterChange(valid.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTabClick = (id) => {
    onFilterChange(id)
    window.location.hash = id === 'ALL' ? '' : `#${id}`
  }

  return (
    <header
      className="sticky top-0 z-50 px-6 py-4"
      style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-2">
            <span className="pulse-dot" />
            <span
              className="text-xs tracking-widest uppercase"
              style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}
            >
              LIVE · Last updated {lastUpdated ? formatTime(lastUpdated) : '—'}
            </span>
          </div>

          {/* Title */}
          <h1
            className="text-xl font-bold leading-tight"
            style={{ fontFamily: "'Syne', sans-serif", color: 'var(--text)' }}
          >
            EU Energy &amp; Inflation Shock Monitor
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            Tracking geopolitical shock impact on European markets
          </p>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-colors"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--muted)',
            fontFamily: "'DM Mono', monospace",
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)' }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mt-3 flex-wrap">
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className="text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{
                fontFamily: "'DM Mono', monospace",
                background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: isActive ? 'var(--text)' : 'var(--muted)',
                border: isActive ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
                cursor: 'pointer',
              }}
            >
              {tab.emoji && <span className="mr-1">{tab.emoji}</span>}
              {tab.label}
            </button>
          )
        })}
      </div>
    </header>
  )
}
