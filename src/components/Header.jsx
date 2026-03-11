import { useEffect } from 'react'
import { FILTER_TABS } from '../utils/constants'
import { formatTime } from '../utils/formatters'

const STATUS_DOT = {
  green: { color: 'var(--positive)', label: 'All sources connected' },
  amber: { color: 'var(--oil)',      label: 'Some sources partially available' },
  red:   { color: 'var(--negative)', label: 'Sources unavailable — showing cached data' },
}

export default function Header({ activeFilter, onFilterChange, onRefresh, lastUpdated, nextUpdate,
  refreshing = false, connectionStatus = 'green', onShowReferences }) {
  const status = STATUS_DOT[connectionStatus] ?? STATUS_DOT.green

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
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          {/* Status eyebrow */}
          <div className="flex items-center gap-2 mb-2">
            <span
              title={status.label}
              style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: status.color, flexShrink: 0 }}
            />
            <span style={{ fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              {connectionStatus === 'green' ? 'Live' : connectionStatus === 'amber' ? 'Partial' : 'Reconnecting'}
              {' · Updated '}{lastUpdated ? formatTime(lastUpdated) : '—'}
              {nextUpdate ? ` · Next: ${nextUpdate}` : ''}
            </span>
          </div>

          <h1 className="font-bold leading-tight" style={{ fontSize: 20, color: 'var(--text)' }}>
            EU Commodity Monitor
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 2 }}>
            Energy, food, freight and inflation data for European markets
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onShowReferences}
            style={{
              fontSize: 14, padding: '6px 12px', borderRadius: 8,
              background: 'transparent', border: '1px solid transparent',
              color: 'var(--muted)', cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)' }}
          >
            References
          </button>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            style={{
              fontSize: 14, padding: '6px 14px', borderRadius: 8,
              background: 'var(--surface)', border: '1px solid var(--border)',
              color: refreshing ? 'var(--muted)' : 'var(--text)',
              cursor: refreshing ? 'not-allowed' : 'pointer', fontWeight: 500,
            }}
            onMouseEnter={(e) => { if (!refreshing) e.currentTarget.style.borderColor = 'var(--text)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            {refreshing ? '⏳ Refreshing…' : '↻ Refresh'}
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
              style={{
                fontSize: 13, padding: '5px 12px', borderRadius: 8,
                background: isActive ? 'var(--text)' : '#E8EAF2',
                color: isActive ? '#FFFFFF' : 'var(--text)',
                border: '1px solid transparent',
                cursor: 'pointer', fontWeight: isActive ? 600 : 400,
                transition: 'background 0.12s',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </header>
  )
}
