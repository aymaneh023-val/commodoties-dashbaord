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
    return positive ? 'text-[#2D7A4F]' : 'text-[#D94F3D]'
  }
  return positive ? 'text-[#D94F3D]' : 'text-[#2D7A4F]'
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
    return positive ? '#2D7A4F' : '#D94F3D'
  }
  return positive ? '#D94F3D' : '#2D7A4F'
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
 * Convert a Unix timestamp (seconds) to a short date label including year.
 * @param {number} ts - Unix seconds
 */
export function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  const day = d.getDate()
  const year = String(d.getFullYear()).slice(2)
  return `${month} ${day} '${year}`
}

/**
 * Format a Date object or ISO string to HH:MM CET/CEST.
 * @param {Date|string} date
 */
export function formatTime(date) {
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Brussels',
    timeZoneName: 'short',
  })
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
 * Format a month string → "Jan 2025".
 * Handles "2025-01" and Eurostat "2025M01" notation.
 * @param {string} monthStr
 */
export function formatMonth(monthStr) {
  if (!monthStr) return ''
  const mMatch = monthStr.match(/^(\d{4})M(\d{2})$/)
  if (mMatch) {
    const d = new Date(parseInt(mMatch[1]), parseInt(mMatch[2]) - 1, 1)
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }
  const parts = monthStr.split('-')
  if (parts.length === 2) {
    const m = parseInt(parts[1])
    if (m >= 1 && m <= 12) {
      const d = new Date(parseInt(parts[0]), m - 1, 1)
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }
  }
  return monthStr
}

/**
 * Short month+year label "Jan '25" from "2025-01" or "2025M01".
 */
export function shortMonth(monthStr) {
  if (!monthStr) return ''
  const mMatch = monthStr.match(/^(\d{4})M(\d{2})$/)
  if (mMatch) {
    const d = new Date(parseInt(mMatch[1]), parseInt(mMatch[2]) - 1, 1)
    const yr = String(d.getFullYear()).slice(2)
    return `${d.toLocaleDateString('en-US', { month: 'short' })} '${yr}`
  }
  const parts = monthStr.split('-')
  if (parts.length === 2) {
    const m = parseInt(parts[1])
    if (m >= 1 && m <= 12) {
      const d = new Date(parseInt(parts[0]), m - 1, 1)
      const yr = String(d.getFullYear()).slice(2)
      return `${d.toLocaleDateString('en-US', { month: 'short' })} '${yr}`
    }
  }
  return monthStr
}
