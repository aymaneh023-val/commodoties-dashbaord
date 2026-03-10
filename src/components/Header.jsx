import { useEffect } from 'react'
import { FILTER_TABS } from '../utils/constants'
import { formatTime } from '../utils/formatters'

const STATUS_DOT = {
  green: { color: '#22c55e', label: 'All sources connected', animation: '' },
  amber: { color: '#f59e0b', label: 'Some sources partially available', animation: '' },
  red:   { color: '#ef4444', label: 'Sources unavailable — showing fallback data', animation: '' },
}

export default function Header({ activeFilter, onFilterChange, onRefresh, lastUpdated, connectionStatus = 'green', onShowReferences }) {
  const status = STATUS_DOT[connectionStatus] ?? STATUS_DOT.green
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
            <span
              className={status.animation}
              title={status.label}
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: status.color,
                flexShrink: 0,
              }}
            />
            <span
              className="text-xs tracking-widest uppercase"
              style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}
            >
              {connectionStatus === 'green' ? 'Connected' : connectionStatus === 'amber' ? 'Partial' : 'Reconnecting'} · Last updated {lastUpdated ? formatTime(lastUpdated) : '—'}
            </span>
          </div>

          {/* Title */}
          <h1
            className="text-xl font-bold leading-tight"
            style={{ fontFamily: "'Syne', sans-serif", color: 'var(--text)' }}
          >
            EU Commodity Monitor
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            Live prices, supply routes, and macro indicators for European markets
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onShowReferences}
            className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-colors"
            style={{
              background: 'transparent',
              border: '1px solid transparent',
              color: 'var(--muted)',
              fontFamily: "'DM Mono', monospace",
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)' }}
          >
            References
          </button>
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
                background: isActive ? 'var(--surface2)' : 'transparent',
                color: isActive ? 'var(--text)' : 'var(--muted)',
                border: isActive ? '1px solid var(--border)' : '1px solid transparent',
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
