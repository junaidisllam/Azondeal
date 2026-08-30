import { Metadata } from 'next'
import React from 'react'
import ExploreSection from '@/app/sections/ExploreSection'
import ExploreSearchBar from '@/components/ExploreSearchBar'
import { LayoutGrid } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Explore All Deals & Promo Codes | Azon Deal',
  description: 'Browse thousands of verified deals, promo codes, and discounts across all categories. Use our advanced filters to find exactly what you need.',
  openGraph: {
    title: 'Explore All Deals | Azon Deal',
    description: 'Discover the best savings with our powerful deal explorer.',
  }
}

export default function ExplorePage() {
  return (
    <main className="min-h-screen bg-white pb-20">
      {/* Premium Header */}
      <div className="bg-zinc-50 border-b border-zinc-100">
        <div className="max-w-[1280px] mx-auto px-4 py-6 md:py-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider mb-2">
                <LayoutGrid size={10} />
                Deal Explorer
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-zinc-900 tracking-tight">
                Explore <span className="text-primary">Everything</span>
              </h1>
              <div className="h-1 w-12 bg-primary mt-2 rounded-full" />
              <p className="text-zinc-500 mt-3 max-w-lg font-medium text-sm leading-relaxed">
                Browse our entire selection of verified coupons, promo codes, and deals. 
                Filter by category, discount, or price to find the perfect saving.
              </p>
            </div>
            
            <div className="w-full lg:w-auto lg:min-w-[460px] xl:min-w-[520px] shrink-0">
              <ExploreSearchBar />
            </div>
          </div>
        </div>
      </div>

      {/* Main Explore Content */}
      <div className="mt-2 md:mt-4">
        <React.Suspense fallback={<div className="min-h-[400px] flex items-center justify-center"><p className="text-zinc-400">Loading Explorer...</p></div>}>
          <ExploreSection showHeader={false} />
        </React.Suspense>
      </div>
    </main>
  )
}
