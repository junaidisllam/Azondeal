'use client'

/**
 * DealSlider — generic slider used by both TopDealsSection and PromoCodesSection.
 *
 * Optimizations vs the original duplicated code:
 *  • formatPrice / formatDeal imported from shared util (no copy-paste).
 *  • savedAsins fetch deduped: if prop is non-empty we skip the API call entirely.
 *  • clientCache check extracted to an initializer so useState never runs the
 *    fetch-then-setState pattern on the first render.
 *  • Mobile scroll container gets `will-change: scroll-position` removed
 *    (browser handles it; manual will-change forces a compositor layer for
 *    every card and wastes GPU memory on low-end phones).
 *  • Skeleton array created with useMemo so it's not re-created on re-renders.
 *  • Splide options object is stable (defined outside or memo'd) — previously
 *    a new object was created on every render, causing Splide to re-initialize.
 */

import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@heroui/button'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { DealCard, DealCardSkeleton } from '@/components/DealCard'

// @ts-expect-error: no types
import { Splide, SplideSlide } from '@splidejs/react-splide'
import '@splidejs/react-splide/css'

import { clientCache } from '@/lib/cache'
import { formatDeal } from '@/lib/formatDeal'

// Stable Splide options — one object, not recreated per render
const SPLIDE_OPTIONS = {
  perPage: 5,
  gap: '1rem',
  pagination: false,
  arrows: true,
  rewind: true,
  breakpoints: {
    1280: { perPage: 5 },
    1024: { perPage: 4 },
    768:  { perPage: 3 },
    640:  { perPage: 2 },
  },
} as const

interface DealSliderProps {
  title: string
  viewAllHref: string
  cacheKey: string
  apiEndpoint: string
  initialDeals?: any[]
  savedAsins?: string[]
  dealOverrides?: (item: any, index: number) => Record<string, any>
  skeletonCount?: number
}

export default function DealSlider({
  title,
  viewAllHref,
  cacheKey,
  apiEndpoint,
  initialDeals = [],
  savedAsins = [],
  dealOverrides,
  skeletonCount = 5,
}: DealSliderProps) {
  const [deals, setDeals] = useState<any[]>(() =>
    initialDeals.length > 0 ? initialDeals : (clientCache.get(cacheKey) || [])
  )
  const [isLoading, setIsLoading] = useState(
    initialDeals.length === 0 && !clientCache.has(cacheKey)
  )
  const [userSavedAsins, setUserSavedAsins] = useState<string[]>(savedAsins)

  // Stable skeleton array — useMemo so it's not recreated on every render
  const skeletons = useMemo(
    () => Array.from({ length: skeletonCount }, (_, i) => i),
    [skeletonCount]
  )

  useEffect(() => {
    // Only fetch savedAsins if not provided by the server
    if (savedAsins.length === 0) {
      fetch('/api/deals/save')
        .then(r => r.json())
        .then(d => { if (d.savedAsins) setUserSavedAsins(d.savedAsins) })
        .catch(() => {})
    }

    if (clientCache.has(cacheKey)) return

    fetch(apiEndpoint)
      .then(r => r.json())
      .then(data => {
        const raw = Array.isArray(data) ? data : (data.deals || [])
        const formatted = raw.map((item: any, i: number) =>
          formatDeal(item, i, dealOverrides?.(item, i) ?? {})
        )
        setDeals(formatted)
        clientCache.set(cacheKey, formatted)
        setIsLoading(false)
      })
      .catch(err => {
        console.error(`${title} fetch error:`, err)
        setIsLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!isLoading && deals.length === 0) return null

  return (
    <div className="max-w-[1280px] mx-auto px-4 mt-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-[#111827]">{title}</h2>
        <Button
          as={Link}
          href={viewAllHref}
          className="bg-primary text-white rounded-full px-5 h-9"
          size="sm"
          endContent={<ChevronRight size={18} />}
        >
          View All
        </Button>
      </div>

      {/* Desktop Slider */}
      <div className="hidden sm:block product-slider pb-4 relative">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {skeletons.map(i => <DealCardSkeleton key={i} />)}
          </div>
        ) : (
          <Splide options={SPLIDE_OPTIONS}>
            {deals.map((deal, index) => (
              <SplideSlide key={deal.id}>
                <DealCard
                  deal={deal}
                  priority={index < 2}
                  isSaved={userSavedAsins.includes(deal.asin)}
                />
              </SplideSlide>
            ))}
          </Splide>
        )}
      </div>

      {/* Mobile Horizontal Scroll */}
      <div className="sm:hidden">
        {/* overflow-x-auto + snap — no will-change, browser uses compositor natively */}
        <div className="flex gap-4 pb-6 overflow-x-auto snap-x snap-mandatory no-scrollbar">
          {isLoading
            ? skeletons.slice(0, 4).map(i => (
                <div key={i} className="min-w-[170px] snap-center">
                  <DealCardSkeleton />
                </div>
              ))
            : deals.map((deal, index) => (
                <div key={deal.id} className="min-w-[170px] snap-center">
                  <DealCard
                    deal={deal}
                    priority={index < 2}
                    isSaved={userSavedAsins.includes(deal.asin)}
                  />
                </div>
              ))
          }
        </div>
      </div>
    </div>
  )
}
