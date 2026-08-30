// Shared across all sections — defined once, imported everywhere.
// Previously copy-pasted in page.tsx, TopDealsSection, PromoCodesSection, ExploreSection.

export const formatPrice = (price: any): string => {
  if (price == null) return ''
  const num = Number(price)
  return isNaN(num) ? price : num.toFixed(2).replace(/\.?0+$/, '')
}

export const formatDeal = (item: any, index: number, overrides: Record<string, any> = {}) => ({
  asin:          item.asin || item.deal_hash || `deal-${index}`,
  id:            item.asin || item.deal_hash || `deal-${index}`,
  hash:          item.deal_hash,
  title:         item.title,
  image:         item.image || item.image_url,
  discount:      item.discount_percentage ? `${Math.round(item.discount_percentage)}% OFF` : 'Deal',
  price:         `$${formatPrice(item.discounted_price || item.price)}`,
  originalPrice: `$${formatPrice(item.list_price || item.price)}`,
  promo_code:    item.promo_code || item.codes?.[0],
  hasPromo:      !!(item.promo_code || item.has_promo_code || item.has_coupon || item.codes?.length),
  rating:        item.avg_rating ?? item.rating ?? 4.5,
  reviews:       item.ratings_count ?? item.reviews_count ?? 0,
  sold:          item.bought_past_month > 0 ? `${item.bought_past_month}+ Sold` : undefined,
  store:         item.merchant_name || 'Amazon',
  merchant_id:   item.merchant_id,
  ...overrides,
})
