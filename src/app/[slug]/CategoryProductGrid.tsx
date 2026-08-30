'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { DealCard, DealCardSkeleton } from "@/components/DealCard"
import { Button } from "@heroui/button"
import { formatDeal } from '@/lib/formatDeal'

interface CategoryProductGridProps {
  searchKeyword: string
  categoryName: string
}

export default function CategoryProductGrid({ searchKeyword, categoryName }: CategoryProductGridProps) {
  const [products, setProducts] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const fetchProducts = useCallback(async (pageNum: number, isInitial: boolean = false) => {
    if (isInitial) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const res = await fetch(`/api/search?query=${encodeURIComponent(searchKeyword)}&category=${encodeURIComponent(categoryName)}&page=${pageNum}&limit=24`)
      if (res.ok) {
        const data = await res.json()
        const rawDeals = Array.isArray(data) ? data : (data.deals || [])
        
        const formattedNewProducts = rawDeals
          .map((item: any, i: number) => formatDeal(item, i, { 
            asin: item.asin || item.deal_hash || `cat-${pageNum}-${i}`,
            id: item.asin || item.deal_hash || `cat-${pageNum}-${i}`
          }))
          .filter(Boolean);

        setProducts(prev => {
          const combined = isInitial ? formattedNewProducts : [...prev, ...formattedNewProducts];
          
          // Deduplicate by id to prevent React key errors and duplicate cards
          const uniqueProducts = combined.filter((item: any, index: number, self: any[]) =>
            index === self.findIndex((p: any) => p.id === item.id)
          );

          if (isInitial) {
            // Sort only the first batch if it's initial
            return [...uniqueProducts].sort((a: any, b: any) => {
              if (a.hasPromo && !b.hasPromo) return -1;
              if (!a.hasPromo && b.hasPromo) return 1;
              return 0;
            });
          }
          
          return uniqueProducts;
        });

        setPage(pageNum)
        setHasMore(rawDeals.length >= 24)
      } else {
        if (isInitial) setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      if (isInitial) setHasMore(false);
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [searchKeyword]);

  useEffect(() => {
    fetchProducts(1, true)
  }, [fetchProducts])

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <DealCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (products.length === 0 && !isLoading) {
    return (
      <div className="bg-white rounded-[3rem] p-20 text-center border border-zinc-100 shadow-sm">
        <h2 className="text-2xl font-black text-zinc-900 mb-2">No deals found for this category</h2>
        <p className="text-zinc-500 mb-8">We're currently searching for the best {categoryName} deals for you. Check back soon!</p>
        <Button
          as="a"
          href="/categories"
          className="inline-flex h-14 px-10 items-center justify-center rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 hover:scale-105 transition-all"
        >
          Browse All Categories
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {products.map((product: any) => (
          <DealCard key={product.id} deal={product} />
        ))}
      </div>
      
      {hasMore && (
        <div className="flex justify-center mt-4">
          <Button 
            onPress={() => fetchProducts(page + 1)} 
            isLoading={isLoadingMore}
            className="px-12 h-14 font-black text-white bg-primary rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all uppercase tracking-widest text-sm"
          >
            {isLoadingMore ? 'Loading...' : 'Load More Deals'}
          </Button>
        </div>
      )}
    </div>
  )
}
