'use client'

import DealSlider from './DealSlider'

export default function TopDealsSection({
  initialDeals = [],
  savedAsins = [],
}: {
  initialDeals?: any[]
  savedAsins?: string[]
}) {
  return (
    <DealSlider
      title="Today's Top Deals"
      viewAllHref="/top-deals"
      cacheKey="top-deals"
      apiEndpoint="/api/today-trending"
      initialDeals={initialDeals}
      savedAsins={savedAsins}
      // rank is position-based, not in the raw API response
      dealOverrides={(_, index) => ({ rank: index + 1 })}
    />
  )
}
