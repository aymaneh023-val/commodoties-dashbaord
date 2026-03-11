import { useState, useCallback, useEffect, useMemo } from 'react'
import Header from './components/Header'
import WatchStrip from './components/WatchStrip'
import NewsFeed from './components/NewsFeed'
import References from './components/References'
import CrudeOil from './components/sections/CrudeOil'
import GasLNG from './components/sections/GasLNG'
import Shipping from './components/sections/Shipping'
import Fertilizer from './components/sections/Fertilizer'
import FoodCommodities from './components/sections/FoodCommodities'
import CompareSection from './components/sections/CompareSection'
import Inflation from './components/sections/Inflation'
import { useCommodityData } from './hooks/useCommodityData'
import { useNewsData } from './hooks/useNewsData'
import { useFoodCommoditiesData } from './hooks/useFoodCommoditiesData'
import { useInflationData } from './hooks/useInflationData'
import { formatTime } from './utils/formatters'

// Cron schedule: 00:00, 06:00, 09:00, 12:00, 15:00, 18:00 UTC
const SCHEDULED_HOURS = [0, 6, 9, 12, 15, 18]

function getNextUpdateLabel(lastUpdated) {
  if (!lastUpdated) return null
  const base = new Date(lastUpdated)
  for (let d = 0; d <= 1; d++) {
    for (const h of SCHEDULED_HOURS) {
      const t = new Date(base)
      t.setUTCDate(base.getUTCDate() + d)
      t.setUTCHours(h, 0, 0, 0)
      if (t > base) return `${String(t.getUTCHours()).padStart(2, '0')}:00 UTC`
    }
  }
  return null
}

export default function App() {
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [showReferences, setShowReferences] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const { data: commodityData, refresh: refreshCommodity, lastUpdated } = useCommodityData()
  const { articles, loading: newsLoading, error: newsError, refresh: refreshNews } = useNewsData()
  const { data: foodData, refresh: refreshFood } = useFoodCommoditiesData()
  const inflationData = useInflationData()

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    refreshCommodity({ force: true })
    refreshFood({ force: true })
    refreshNews()
  }, [refreshCommodity, refreshFood, refreshNews])

  // Reset the refreshing spinner once all commodity data finishes loading
  const anyLoading = Object.values(commodityData).some((d) => d.loading)
  useEffect(() => {
    if (!anyLoading) setRefreshing(false)
  }, [anyLoading])

  const nextUpdate = useMemo(() => getNextUpdateLabel(lastUpdated), [lastUpdated])

  // Connection status: green = all live, amber = some degraded, red = all down
  const commodityValues = Object.values(commodityData)
  const commodityErrorCount = commodityValues.filter((d) => d.error).length
  const newsDegraded = !!newsError
  const allDown = commodityErrorCount === commodityValues.length && newsDegraded
  const anyDegraded = commodityErrorCount > 0 || newsDegraded
  const connectionStatus = allDown ? 'red' : anyDegraded ? 'amber' : 'green'

  const sectionVisible = (tag) => activeFilter === 'ALL' || activeFilter === tag

  if (showReferences) {
    return <References onBack={() => setShowReferences(false)} />
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onRefresh={handleRefresh}
        lastUpdated={lastUpdated}
        nextUpdate={nextUpdate}
        refreshing={refreshing}
        connectionStatus={connectionStatus}
        onShowReferences={() => setShowReferences(true)}
      />

      <WatchStrip
        commodityData={commodityData}
        foodData={foodData}
      />

      {/* Orientation banner */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 24px 0' }}>
        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 860 }}>
          Selected commodity, energy, fertilizer, shipping, and food price indicators relevant to food and agriculture markets.
          Data reflects front-month futures or latest available releases.
        </p>
      </div>

      <div
        className="two-col"
        style={{ padding: '24px 24px 48px', maxWidth: 1400, margin: '0 auto' }}
      >
        {/* Left column — data sections */}
        <main>
          {sectionVisible('food') && (
            <FoodCommodities data={foodData} />
          )}
          {sectionVisible('oil') && (
            <CrudeOil brent={commodityData.brent} />
          )}
          {sectionVisible('gas') && (
            <GasLNG ttf={commodityData.ttf} />
          )}
          {sectionVisible('fertilizer') && (
            <Fertilizer urea={commodityData.urea} />
          )}
          {sectionVisible('shipping') && (
            <Shipping
              bdry={commodityData.bdry}
              zim={commodityData.zim}
            />
          )}
          {sectionVisible('inflation') && (
            <Inflation
              eu={inflationData.eu}
              uk={inflationData.uk}
              us={inflationData.us}
            />
          )}
          {sectionVisible('compare') && (
            <CompareSection commodityData={commodityData} />
          )}
        </main>

        {/* Right column — sticky news feed */}
        <div>
          <NewsFeed
            articles={articles}
            loading={newsLoading}
            error={newsError}
            activeFilter={activeFilter}
          />
        </div>
      </div>

      {/* Data source footer */}
      <div
        style={{
          maxWidth: 1400, margin: '0 auto', padding: '16px 24px 40px',
          borderTop: '1px solid var(--border)',
        }}
      >
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8 }}>
          Data sources: ICE, CBOT, Eurostat, ONS, BLS, Yahoo Finance.
          Futures prices represent front-month contracts.
        </p>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
          Last updated: {lastUpdated ? formatTime(lastUpdated) : '—'}
        </p>
      </div>
    </div>
  )
}
