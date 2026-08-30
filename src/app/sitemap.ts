import { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { isDbConfigured } from '@/lib/db-config'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Cache for 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://azondeal.com'

  // Data storage
  let categories: any[] = []
  let brands: any[] = []
  let deals: any[] = []
  
  const isConfigured = isDbConfigured()

  try {
    // 1. Fetch Categories & Deals from DB if configured
    if (isConfigured) {
      const [cats, latestDeals] = await Promise.all([
        db.category.findMany({ select: { slug: true, updatedAt: true } }).catch(() => []),
        db.deal.findMany({
          take: 1000,
          orderBy: { created_at: 'desc' },
          select: { asin: true, last_updated: true }
        }).catch(() => [])
      ])
      categories = cats
      deals = latestDeals
    }

    // 2. Fetch Brands from External API
    const brandRes = await fetch('https://newestdealflow.dealseek.com/deals/brands', {
      next: { revalidate: 259200 }
    }).catch(() => null)

    if (brandRes && brandRes.ok) {
      const brandData = await brandRes.json().catch(() => [])
      brands = Array.isArray(brandData) ? brandData : []
    }
  } catch (error) {
    console.error('[Sitemap] Data fetch error:', error)
  }

  // Generate Category Entries
  const categoryEntries: MetadataRoute.Sitemap = categories
    .filter(cat => cat && cat.slug)
    .flatMap((cat) => [
      {
        url: `${baseUrl}/${cat.slug}-coupons`,
        lastModified: cat.updatedAt || new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/categories/${cat.slug}`,
        lastModified: cat.updatedAt || new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      }
    ])

  // Generate Brand Entries
  const brandEntries: MetadataRoute.Sitemap = brands
    .filter(brand => brand && brand.slug)
    .map((brand) => ({
      url: `${baseUrl}/brand/${brand.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }))

  // Generate Deal Entries
  const dealEntries: MetadataRoute.Sitemap = deals
    .filter(deal => deal && deal.asin)
    .map((deal) => ({
      url: `${baseUrl}/deal/${deal.asin}`,
      lastModified: deal.last_updated || new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    }))

  // Static Pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/explore`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/top-deals`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/brands`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/categories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/affiliate-disclosure`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]

  return [
    ...staticPages,
    ...categoryEntries,
    ...brandEntries,
    ...dealEntries,
  ]
}
