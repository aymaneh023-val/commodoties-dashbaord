/**
 * Format a numeric price value.
 * @param {number|null} val
 * @param {number} decimals
 * @param {string} prefix - currency symbol
 */
export function formatPrice(val, decimals = 2, prefix = '') {
  if (val == null || isNaN(val)) return '—'
  return `${prefix}${val.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

/**
 * Format a percentage change value with sign.
 * @param {number|null} val
 */
export function formatPct(val) {
  if (val == null || isNaN(val)) return '—'
  const sign = val >= 0 ? '+' : ''
  return `${sign}${val.toFixed(2)}%`
}

/**
 * Return Tailwind text-color class for a pct change.
 * For energy/inflation: positive change = red (bad), negative = green (good).
 * inverse=true flips (e.g., shipping decline can be good).
 * @param {number|null} val
 * @param {boolean} inverse
 */
export function pctColorClass(val, inverse = false) {
  if (val == null || isNaN(val)) return 'text-[var(--muted)]'
  const positive = val >= 0
  if (inverse) {
    return positive ? 'text-[#4ade80]' : 'text-[#f87171]'
  }
  return positive ? 'text-[#f87171]' : 'text-[#4ade80]'
}

/**
 * Return inline style color for pct change (for badges, etc.)
 * @param {number|null} val
 * @param {boolean} inverse
 */
export function pctColor(val, inverse = false) {
  if (val == null || isNaN(val)) return 'var(--muted)'
  const positive = val >= 0
  if (inverse) {
    return positive ? '#4ade80' : '#f87171'
  }
  return positive ? '#f87171' : '#4ade80'
}

/**
 * Arrow symbol for pct change.
 * @param {number|null} val
 */
export function pctArrow(val) {
  if (val == null || isNaN(val)) return ''
  return val >= 0 ? '▲' : '▼'
}

/**
 * Convert a Unix timestamp (seconds) to a short date label.
 * @param {number} ts - Unix seconds
 */
export function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Format a Date object or ISO string to HH:MM UTC.
 * @param {Date|string} date
 */
export function formatTime(date) {
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }) + ' UTC'
}

/**
 * Return "2h ago" style relative time from an ISO string or Date.
 * @param {string|Date} isoString
 */
export function timeAgo(isoString) {
  if (!isoString) return ''
  const now = Date.now()
  const then = new Date(isoString).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

/**
 * Format a month string like "2025-01" → "Jan 2025"
 * @param {string} monthStr
 */
export function formatMonth(monthStr) {
  if (!monthStr) return ''
  const [year, month] = monthStr.split('-')
  const d = new Date(parseInt(year), parseInt(month) - 1, 1)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

/**
 * Short month label "Jan" from "2025-01"
 */
export function shortMonth(monthStr) {
  if (!monthStr) return ''
  const [year, month] = monthStr.split('-')
  const d = new Date(parseInt(year), parseInt(month) - 1, 1)
  return d.toLocaleDateString('en-US', { month: 'short' })
}
