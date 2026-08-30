'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@heroui/button"
import { Trophy, ChevronRight, Filter, Sparkles } from 'lucide-react'
import { DealCard, DealCardSkeleton } from '@/components/DealCard'

export default function TopDealsPage() {
  const [deals, setDeals] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const formatPrice = (price: any) => {
    if (price === undefined || price === null) return '0';
    const num = Number(price);
    return isNaN(num) ? String(price) : num.toFixed(2).replace(/\.?0+$/, '');
  }

  const fetchDeals = useCallback(async (pageNum: number, isLoadMore = false) => {
    if (isLoadMore) setIsLoadingMore(true)
    else setIsLoading(true)

    try {
      const response = await fetch('/api/today-trending')
      const data = await response.json()

      const results = Array.isArray(data) ? data : (data.deals || [])
      const formattedResults = results.map((item: any, index: number) => ({
        asin: item.asin || item.deal_hash || index.toString(),
        id: item.asin || item.deal_hash || index.toString(),
        hash: item.deal_hash,
        title: item.title,
        image: item.image || item.image_url,
        discount: item.discount_percentage ? `${Math.round(item.discount_percentage)}% OFF` : 'Deal',
        price: `$${formatPrice(item.discounted_price || item.price)}`,
        originalPrice: `$${formatPrice(item.list_price || item.price)}`,
        store: item.merchant_name || 'Amazon',
        promo_code: item.promo_code || (item.codes && item.codes[0]),
        hasPromo: !!(item.promo_code || item.has_promo_code || item.has_coupon || (item.codes && item.codes.length > 0)),
        rating: item.avg_rating || item.rating,
        reviews: item.ratings_count || item.reviews_count,
        sold: item.bought_past_month > 0 ? `${item.bought_past_month}+ Sold` : undefined,
        rank: (pageNum - 1) * 25 + index + 1
      }))

      if (isLoadMore) {
        setDeals(prev => {
          const combined = [...prev, ...formattedResults]
          // Filter out duplicates based on id (asin/deal_hash)
          const uniqueDeals = combined.filter((deal: any, idx: number, self: any[]) =>
            idx === self.findIndex((d) => d.id === deal.id)
          )
          return uniqueDeals
        })
      } else {
        // Filter out duplicates for the initial load as well
        const uniqueDeals = formattedResults.filter((deal: any, idx: number, self: any[]) =>
          idx === self.findIndex((d) => d.id === deal.id)
        )
        setDeals(uniqueDeals)
      }

      // /api/today-trending delivers all items in a single request, no pagination needed
      setHasMore(false)
    } catch (error) {
      console.error('Error fetching top deals:', error)
      setHasMore(false)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    fetchDeals(1)
  }, [fetchDeals])

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return
    const nextPage = page + 1
    setPage(nextPage)
    fetchDeals(nextPage, true)
  }, [page, fetchDeals, isLoadingMore, hasMore])

  const loadMoreRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    const currentRef = loadMoreRef.current
    if (!currentRef || !hasMore || isLoadingMore || isLoading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '400px' // Start loading when user is 400px away from bottom
      }
    )

    observer.observe(currentRef)

    return () => {
      if (currentRef) observer.unobserve(currentRef)
    }
  }, [hasMore, isLoadingMore, isLoading, handleLoadMore])

  return (
    <main className="min-h-screen bg-[#F9FAFB] pb-20">
      {/* Premium Human-Centric Header */}
      <div className="relative overflow-hidden bg-white border-b border-zinc-100">
        {/* Subtle Background Pattern/Gradient */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-50/50 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1280px] mx-auto px-4 py-4 sm:py-6 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] mb-3 sm:mb-4">
              <Trophy size={12} className="text-primary" />
              <span>Verified Top 50</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-zinc-900 mb-3 sm:mb-4 leading-tight tracking-tight">
              The Most <span className="text-primary">Reliable</span> Deals, Curated for You.
            </h1>

          </div>
        </div>
      </div>

      {/* Deals Grid Area */}
      <div className="max-w-[1280px] mx-auto px-4 pt-6 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm border border-zinc-100">
              <Sparkles className="text-primary" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900">Curated Selection</h2>
              <p className="text-sm text-zinc-400 font-medium">Updated every hour</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {Array.from({ length: 15 }).map((_, i) => (
              <DealCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            <div 
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6"
              style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 1200px' }}
            >
              {deals.map((deal) => (
                <div key={deal.id} className="h-full" style={{ contain: 'content' }}>
                  <DealCard deal={deal} />
                </div>
              ))}
            </div>

            {hasMore && (
              <div ref={loadMoreRef} className="flex justify-center pt-8">
                <Button
                  onPress={handleLoadMore}
                  isLoading={isLoadingMore}
                  className="px-12 h-14 font-bold text-white bg-primary rounded-full shadow-xl shadow-orange-100 transition-all hover:scale-105 active:scale-95"
                >
                  Loading More Top Deals...
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
