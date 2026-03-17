import { useState, useCallback, useEffect } from 'react'
import Header from './components/Header'
import WatchStrip from './components/WatchStrip'
import NewsFeed from './components/NewsFeed'
import Commodities from './components/sections/Commodities'
import Shipping from './components/sections/Shipping'
import Fertilizer from './components/sections/Fertilizer'
import FoodCommodities from './components/sections/FoodCommodities'
import Inflation from './components/sections/Inflation'
import { useCommodityData } from './hooks/useCommodityData'
import { useNewsData } from './hooks/useNewsData'
import { useInflationData } from './hooks/useInflationData'
import { useBarometerData } from './hooks/useBarometerData'

export default function App() {
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [refreshing, setRefreshing] = useState(false)
  const [canRefresh, setCanRefresh] = useState(false)
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null)

  const { data: commodityData, refresh: refreshCommodity, lastUpdated } = useCommodityData()
  const { articles, loading: newsLoading, error: newsError, refresh: refreshNews } = useNewsData()
  const { countries: inflationCountries, loading: inflationLoading, error: inflationError, refresh: refreshInflation } = useInflationData()
  const barometerData = useBarometerData()

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    setCanRefresh(false)
    try {
      await Promise.all([
        refreshCommodity({ force: true }),
        refreshInflation({ force: true }),
        refreshNews({ force: true }),
      ])
      setLastRefreshedAt(new Date())
    } finally {
      setRefreshing(false)
    }
  }, [refreshCommodity, refreshInflation, refreshNews])

  // Check server-side cooldown on mount
  useEffect(() => {
    fetch('/api/last-refreshed')
      .then((r) => r.json())
      .then(({ lastRefreshed }) => {
        if (!lastRefreshed) { setCanRefresh(true); return }
        const elapsed = Date.now() - new Date(lastRefreshed).getTime()
        setLastRefreshedAt(new Date(lastRefreshed))
        setCanRefresh(elapsed >= 60 * 60 * 1000)
      })
      .catch(() => setCanRefresh(true))
  }, [])

  // Connection status: green = all live, amber = some degraded, red = all down
  const commodityValues = Object.values(commodityData)
  const commodityErrorCount = commodityValues.filter((d) => d.error).length
  const newsDegraded = !!newsError
  const allDown = commodityErrorCount === commodityValues.length && newsDegraded
  const anyDegraded = commodityErrorCount > 0 || newsDegraded
  const connectionStatus = allDown ? 'red' : anyDegraded ? 'amber' : 'green'

  const sectionVisible = (tag) => activeFilter === 'ALL' || activeFilter === tag
  const isOverview = activeFilter === 'ALL'

  return (
    <div>
      <Header
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onRefresh={handleRefresh}
        lastUpdated={lastUpdated}
        refreshing={refreshing}
        canRefresh={canRefresh}
        lastRefreshedAt={lastRefreshedAt}
        connectionStatus={connectionStatus}
      />

      <WatchStrip commodityData={commodityData} />

      <div
        className="two-col px-4 md:px-6"
        style={{ paddingTop: 24, paddingBottom: 48, maxWidth: 1400, margin: '0 auto' }}
      >
        {/* Left column — data sections */}
        <main>
          {(sectionVisible('commodities') || activeFilter === 'metals') && (
            <Commodities data={commodityData} isOverview={isOverview} />
          )}
          {sectionVisible('fertilizers') && (
            <Fertilizer data={commodityData} isOverview={isOverview} />
          )}
          {sectionVisible('food') && (
            <FoodCommodities data={commodityData} isOverview={isOverview} />
          )}
          {sectionVisible('shipping') && (
            <Shipping data={commodityData} isOverview={isOverview} />
          )}
          {sectionVisible('macro') && (
            <Inflation
              countries={inflationCountries}
              loading={inflationLoading}
              error={inflationError}
              barometer={barometerData}
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
