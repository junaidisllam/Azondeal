
import React, { Suspense } from 'react'
import nextDynamic from 'next/dynamic'
import HeroSection from '@/app/sections/HeroSection'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { formatDeal } from '@/lib/formatDeal'

// Using dynamic imports for sections to improve initial page load performance.
// Below-the-fold sections are wrapped in Suspense for streaming.
const CategorySection   = nextDynamic(() => import('@/app/sections/CategorySection'))
const TopDealsSection   = nextDynamic(() => import('@/app/sections/TopDealsSection'))
const PromoCodesSection = nextDynamic(() => import('@/app/sections/PromoCodesSection'))
const ExploreSection    = nextDynamic(() => import('@/app/sections/ExploreSection'))

// Force dynamic rendering because auth() uses headers/cookies, which prevents static generation.
export const dynamic = 'force-dynamic'

async function getHomeData() {
  try {
    const session = await auth()

    // We execute these sequentially to avoid overwhelming the database pool 
    // on shared hosting environments (like Hostinger) with strict connection limits.
    const slides = await db.heroslide.findMany({
      select: { id: true, desktop: true, mobile: true, alt: true, order: true, link: true },
      orderBy: { order: 'asc' },
      take: 6,
    }).catch(() => [])

    const topDeals = await db.deal.findMany({
      where:   { today_top_deals_position: { gte: 0 } },
      orderBy: { today_top_deals_position: 'asc' },
      take: 10,
    }).catch(() => [])

    const promoCodes = await db.deal.findMany({
      where:   { has_promo_code: true },
      orderBy: { updated_at: 'desc' },
      take: 10,
    }).catch(() => [])

    const categories = await db.category.findMany({
      where: { parentId: null },
      select: { name: true, slug: true, imageSmall: true },
      take: 12
    }).catch(() => [])

    const savedDeals = session?.user?.id
      ? await db.saveddeal.findMany({
          where:   { userId: session.user.id },
          include: { deal: { select: { asin: true } } },
        }).catch(() => [])
      : []

    return {
      slides:     JSON.parse(JSON.stringify(slides || [])),
      topDeals:   (topDeals || []).map((d, i)   => formatDeal(d, i, { rank: i + 1 })),
      promoCodes: (promoCodes || []).map((d, i) => formatDeal(d, i, { hasPromo: true })),
      categories: (categories || []).map(c => ({
        name: c.name,
        image: c.imageSmall,
        href: `/categories/${c.slug}`
      })),
      savedAsins: (savedDeals as any[] || []).map((s) => s.deal.asin),
    }
  } catch (err) {
    // Log the error but don't crash the page; return empty data instead
    console.error('[Home] Data fetch failed. Ensure database is running:', err instanceof Error ? err.message : err)
    return { slides: [], topDeals: [], promoCodes: [], categories: [], savedAsins: [] }
  }
}

export default async function Home() {
  const data = await getHomeData()

  return (
    <main className="min-h-screen bg-[#F9FAFB] pb-20 overflow-x-hidden">
      <HeroSection initialSlides={data.slides} />

      <div className="space-y-0">
        <CategorySection initialCategories={data.categories} />
        <TopDealsSection   initialDeals={data.topDeals}   savedAsins={data.savedAsins} />
        <PromoCodesSection initialDeals={data.promoCodes} savedAsins={data.savedAsins} />

        {/* ExploreSection is below the fold — load lazily, no SSR needed */}
        <Suspense fallback={null}>
          <ExploreSection />
        </Suspense>
      </div>
    </main>
  )
}
