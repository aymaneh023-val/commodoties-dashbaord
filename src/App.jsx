import { useState, useCallback } from 'react'
import Header from './components/Header'
import WatchStrip from './components/WatchStrip'
import ContextRow from './components/ContextRow'
import NewsFeed from './components/NewsFeed'
import References from './components/References'
import CrudeOil from './components/sections/CrudeOil'
import GasLNG from './components/sections/GasLNG'
import Shipping from './components/sections/Shipping'
import Fertilizer from './components/sections/Fertilizer'
import FoodCommodities from './components/sections/FoodCommodities'
import CompareSection from './components/sections/CompareSection'
import { useCommodityData } from './hooks/useCommodityData'
import { useNewsData } from './hooks/useNewsData'
import { useFoodCommoditiesData } from './hooks/useFoodCommoditiesData'
import { usePortWatchData } from './hooks/usePortWatchData'


export default function App() {
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [showReferences, setShowReferences] = useState(false)

  const { data: commodityData, refresh: refreshCommodity } = useCommodityData()
  const { articles, loading: newsLoading, error: newsError, refresh: refreshNews } = useNewsData()
  const { data: foodData, refresh: refreshFood } = useFoodCommoditiesData()
  const { portwatch } = usePortWatchData()

  const handleRefresh = useCallback(() => {
    refreshCommodity()
    refreshNews()
    refreshFood()
    setLastUpdated(new Date())
  }, [refreshCommodity, refreshNews, refreshFood])

  // Update lastUpdated whenever commodity data finishes loading
  const anyLoading = Object.values(commodityData).some((d) => d.loading)
  if (!anyLoading && !lastUpdated) {
    setLastUpdated(new Date())
  }

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
        connectionStatus={connectionStatus}
        onShowReferences={() => setShowReferences(true)}
      />

      <WatchStrip
        commodityData={commodityData}
        foodData={foodData}
      />

      <ContextRow portwatch={portwatch} />

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
              portwatch={portwatch}
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
    </div>
  )
}
