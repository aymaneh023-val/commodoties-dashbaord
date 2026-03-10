import { useState, useCallback } from 'react'
import Header from './components/Header'
import TickerBar from './components/TickerBar'
import NewsFeed from './components/NewsFeed'
import References from './components/References'
import CrudeOil from './components/sections/CrudeOil'
import GasLNG from './components/sections/GasLNG'
import Shipping from './components/sections/Shipping'
import Chokepoints from './components/sections/Chokepoints'
import Fertilizer from './components/sections/Fertilizer'
import FoodCommodities from './components/sections/FoodCommodities'
import Inflation from './components/sections/Inflation'
import CompareSection from './components/sections/CompareSection'
import RiskIndicators from './components/sections/RiskIndicators'
import { useCommodityData } from './hooks/useCommodityData'
import { useEurostatData } from './hooks/useEurostatData'
import { useNewsData } from './hooks/useNewsData'
import { useFoodCommoditiesData } from './hooks/useFoodCommoditiesData'
import { useIMFData } from './hooks/useIMFData'
import { useOECDData } from './hooks/useOECDData'
import { useGDELTData } from './hooks/useGDELTData'
import { usePortWatchData } from './hooks/usePortWatchData'
import { useGPRData } from './hooks/useGPRData'


export default function App() {
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [showReferences, setShowReferences] = useState(false)

  const { data: commodityData, refresh: refreshCommodity } = useCommodityData()
  const { headline, food, combined } = useEurostatData()
  const { articles, loading: newsLoading, error: newsError, refresh: refreshNews } = useNewsData()
  const { data: foodData, refresh: refreshFood } = useFoodCommoditiesData()
  const { pfert } = useIMFData()
  const oecdData = useOECDData()
  const { sparkline: gdeltSparkline } = useGDELTData()
  const { portwatch } = usePortWatchData()
  const gprData = useGPRData()

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
  const eurostatDegraded = headline?.isFallback || food?.isFallback
  const newsDegraded = !!newsError
  const allDown = commodityErrorCount === commodityValues.length && newsDegraded
  const anyDegraded = commodityErrorCount > 0 || eurostatDegraded || newsDegraded
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

      <TickerBar data={commodityData} />

      <div
        className="two-col"
        style={{ padding: '24px 24px 48px', maxWidth: 1400, margin: '0 auto' }}
      >
        {/* Left column — data sections */}
        <main>
          {/* Risk Indicators — always visible at top */}
          {sectionVisible('risk') && (
            <RiskIndicators
              gprHistory={gprData.history}
              gprValue={gprData.gprValue}
              gprStatus={gprData.status}
              gprFallback={gprData.isFallback}
            />
          )}
          {sectionVisible('oil') && (
            <CrudeOil brent={commodityData.brent} wti={commodityData.wti} />
          )}
          {sectionVisible('gas') && (
            <GasLNG ttf={commodityData.ttf} lng={commodityData.lng} />
          )}
          {sectionVisible('shipping') && (
            <Shipping
              bdry={commodityData.bdry}
              zim={commodityData.zim}
              matx={commodityData.matx}
            />
          )}
          {sectionVisible('chokepoints') && (
            <Chokepoints portwatch={portwatch} />
          )}
          {sectionVisible('fertilizer') && (
            <Fertilizer urea={commodityData.urea} pfert={pfert} />
          )}
          {sectionVisible('food') && (
            <FoodCommodities data={foodData} />
          )}
          {sectionVisible('inflation') && (
            <Inflation
              headline={headline}
              food={food}
              combined={combined}
              isFallback={headline?.isFallback || food?.isFallback}
              oecdData={oecdData}
            />
          )}
          {sectionVisible('compare') && (
            <CompareSection
              commodityData={commodityData}
              eurostatData={{ headline, food, combined }}
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
            sparkline={gdeltSparkline}
          />
        </div>
      </div>
    </div>
  )
}
