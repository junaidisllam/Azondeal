import { Metadata } from 'next'
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import ProductDetailContent from "./ProductDetailContent"

interface PageProps {
  params: Promise<{ asin: string }>
  searchParams: Promise<{ platform?: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { asin } = await params
  const { platform } = await searchParams
  
  let title = ''
  let description = ''
  let image = ''
  let categoryName = ''
  let discountedPrice = 0

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/deals/detail/${encodeURIComponent(asin)}?platform=${encodeURIComponent(platform || '')}`, {
      next: { revalidate: 3600 }
    })
    
    if (res.ok) {
      const extDeal = await res.json()
      if (extDeal && extDeal.title) {
        title = extDeal.title
        description = extDeal.promo_string || ''
        image = extDeal.image || (extDeal.image_ids && extDeal.image_ids[0]) || ''
        categoryName = extDeal.category
        discountedPrice = extDeal.discounted_price || extDeal.price || 0
      }
    }
  } catch (err) {
    console.error("[Metadata] Deal detail fetch error:", err)
  }

  if (!title) return { title: 'Product Not Found' }

  // The layout template handles " | Azon Deal", so we only provide the unique part
  const displayTitle = title
  const displayDescription = description || `Get ${title} for only $${discountedPrice?.toFixed(2) || '0.00'}. Discover more handpicked deals in ${categoryName || 'Deals'} on Azon Deal.`

  return {
    title: displayTitle,
    description: displayDescription,
    openGraph: {
      title: displayTitle,
      description: displayDescription,
      type: 'article',
      url: `https://azondeal.com/deal/${asin}`,
      images: image ? [{ url: image, width: 800, height: 800, alt: title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: displayTitle,
      description: displayDescription,
      images: image ? [image] : [],
    },
  }
}

export default async function Page({ params, searchParams }: PageProps) {
  const { asin } = await params
  const { platform } = await searchParams
  
  // Fetch Amazon Affiliate ID using Raw SQL for reliability
  const settings = await db.$queryRawUnsafe('SELECT `value` FROM setting WHERE `key` = ? LIMIT 1', 'amazon_affiliate_id') as any[]
  const affiliateId = settings?.[0]?.value || 'azondeal-20'

  return <ProductDetailContent params={Promise.resolve({ asin })} platform={platform} affiliateId={affiliateId} />
}
