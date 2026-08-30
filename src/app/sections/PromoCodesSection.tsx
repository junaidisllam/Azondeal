'use client'

import DealSlider from './DealSlider'

export default function PromoCodesSection({
  initialDeals = [],
  savedAsins = [],
}: {
  initialDeals?: any[]
  savedAsins?: string[]
}) {
  return (
    <DealSlider
      title="Exclusive Promo Codes"
      viewAllHref="/explore?hasPromoCode=true"
      cacheKey="promo-codes"
      apiEndpoint="/api/top-promo-code"
      initialDeals={initialDeals}
      savedAsins={savedAsins}
      dealOverrides={() => ({ hasPromo: true })}
    />
  )
}
