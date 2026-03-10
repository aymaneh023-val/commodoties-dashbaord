import { useState, useCallback } from 'react'
import Header from './components/Header'
import TickerBar from './components/TickerBar'
import NewsFeed from './components/NewsFeed'
import CrudeOil from './components/sections/CrudeOil'
import GasLNG from './components/sections/GasLNG'
import Shipping from './components/sections/Shipping'
import Fertilizer from './components/sections/Fertilizer'
import Inflation from './components/sections/Inflation'
import { useCommodityData } from './hooks/useCommodityData'
import { useEurostatData } from './hooks/useEurostatData'
import { useNewsData } from './hooks/useNewsData'


export default function App() {
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [lastUpdated, setLastUpdated] = useState(null)

  const { data: commodityData, refresh: refreshCommodity } = useCommodityData()
  const { headline, food, combined } = useEurostatData()
  const { articles, loading: newsLoading, error: newsError, refresh: refreshNews } = useNewsData()

  const handleRefresh = useCallback(() => {
    refreshCommodity()
    refreshNews()
    setLastUpdated(new Date())
  }, [refreshCommodity, refreshNews])

  // Update lastUpdated whenever commodity data finishes loading
  const anyLoading = Object.values(commodityData).some((d) => d.loading)
  if (!anyLoading && !lastUpdated) {
    setLastUpdated(new Date())
  }

  // Connection status: green = all live, amber = some degraded, red = all down
  const commodityValues = Object.values(commodityData)
  const commodityErrorCount = commodityValues.filter((d) => d.error).length
  const eurostatDegraded = headline?.isFallback || food?.isFallback
  const newsDegraded = !!newsError
  const allDown = commodityErrorCount === commodityValues.length && newsDegraded
  const anyDegraded = commodityErrorCount > 0 || eurostatDegraded || newsDegraded
  const connectionStatus = allDown ? 'red' : anyDegraded ? 'amber' : 'green'

  const sectionVisible = (tag) => activeFilter === 'ALL' || activeFilter === tag

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onRefresh={handleRefresh}
        lastUpdated={lastUpdated}
        connectionStatus={connectionStatus}
      />

      <TickerBar data={commodityData} />

      <div
        className="two-col"
        style={{ padding: '24px 24px 48px', maxWidth: 1400, margin: '0 auto' }}
      >
        {/* Left column — data sections */}
        <main>
          {sectionVisible('oil') && (
            <CrudeOil brent={commodityData.brent} wti={commodityData.wti} />
          )}
          {sectionVisible('gas') && (
            <GasLNG ttf={commodityData.ttf} lng={commodityData.lng} />
          )}
          {sectionVisible('shipping') && (
            <Shipping bdi={commodityData.bdi} />
          )}
          {sectionVisible('fertilizer') && (
            <Fertilizer mos={commodityData.mos} />
          )}
          {sectionVisible('inflation') && (
            <Inflation
              headline={headline}
              food={food}
              combined={combined}
              isFallback={headline?.isFallback || food?.isFallback}
            />
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
    </div>
  )
}
