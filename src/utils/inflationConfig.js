/**
 * Inflation country config — single source of truth.
 * Adding a new country requires only one entry here.
 */
const INFLATION_COUNTRIES = [
  { code: 'AUS',       name: 'Australia',      color: '#22C55E' },
  { code: 'GBR',       name: 'United Kingdom',  color: 'var(--gas)' },
  { code: 'USA',       name: 'United States',   color: '#5C69A0' },
  { code: 'EU27_2020', name: 'EU 27',           color: 'var(--inflation)' },
  { code: 'BRA',       name: 'Brazil',          color: '#F59E0B' },
  { code: 'CHN',       name: 'China',           color: '#E63946' },
  { code: 'IND',       name: 'India',           color: '#F97316' },
  { code: 'SAU',       name: 'Saudi Arabia',    color: '#8B5CF6' },
  { code: 'ZAF',       name: 'South Africa',    color: '#14B8A6' },
]

export default INFLATION_COUNTRIES
export const COUNTRY_BY_CODE = Object.fromEntries(
  INFLATION_COUNTRIES.map((c) => [c.code, c])
)
