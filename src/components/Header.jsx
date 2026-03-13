import { useEffect, useState } from 'react'
import { FILTER_TABS } from '../utils/commodityConfig'
import { formatTime } from '../utils/formatters'

const STATUS_DOT = {
  green: { color: 'var(--positive)', label: 'All sources connected' },
  amber: { color: 'var(--oil)',      label: 'Some sources partially available' },
  red:   { color: 'var(--negative)', label: 'Sources unavailable — showing cached data' },
}

export default function Header({ activeFilter, onFilterChange, onRefresh, lastUpdated,
  refreshing = false, canRefresh = false, lastRefreshedAt = null, connectionStatus = 'green' }) {
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
      className="app-header sticky top-0 z-50 px-4 md:px-6 py-3 md:py-4"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-bold leading-tight" style={{ fontSize: 20, color: 'var(--text)' }}>
            Commodity Monitor
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 2 }}>
            Global food supply chain indicators
          </p>
        </div>

        {/* Refresh button — always visible, three states */}
        <div className="flex items-center gap-2 shrink-0">
          <RefreshButton
            canRefresh={canRefresh}
            refreshing={refreshing}
            lastRefreshedAt={lastRefreshedAt}
            onRefresh={onRefresh}
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mt-2 md:mt-3 flex-wrap">
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

function RefreshButton({ canRefresh, refreshing, lastRefreshedAt, onRefresh }) {
  const [now, setNow] = useState(Date.now())

  // Tick every 30s to update "X min ago" label
  useEffect(() => {
    if (canRefresh || refreshing || !lastRefreshedAt) return
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [canRefresh, refreshing, lastRefreshedAt])

  const baseStyle = {
    fontSize: 14, padding: '6px 14px', borderRadius: 8,
    fontWeight: 500, border: '1px solid var(--border)',
    transition: 'all 0.15s',
  }

  // State 1: Refreshing
  if (refreshing) {
    return (
      <button disabled style={{ ...baseStyle, background: 'var(--surface)', color: 'var(--muted)', cursor: 'not-allowed' }}>
        <span className="spinner-inline" /> Refreshing…
      </button>
    )
  }

  // State 2: Cooldown
  if (!canRefresh && lastRefreshedAt) {
    const elapsedMs = now - new Date(lastRefreshedAt).getTime()
    const elapsedMin = Math.floor(elapsedMs / 60_000)
    const remainingMin = 60 - elapsedMin
    const label = elapsedMin < 1 ? 'Updated just now'
      : remainingMin > 0 ? `Next refresh in ${remainingMin} min`
      : 'Up to date'

    return (
      <button disabled style={{ ...baseStyle, background: 'var(--surface2)', color: 'var(--muted)', cursor: 'default' }}>
        ✓ {label}
      </button>
    )
  }

  // State 3: Ready
  return (
    <button
      onClick={onRefresh}
      style={{ ...baseStyle, background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
    >
      ↻ Refresh
    </button>
  )
}
