'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@heroui/button'
import { Spinner } from '@heroui/react'
import { Search, X } from 'lucide-react'
import { DealCard, DealCardSkeleton } from '@/components/DealCard'
import { clientCache } from '@/lib/cache'
import { formatDeal } from '@/lib/formatDeal'

// @ts-expect-error: no types
import { Splide, SplideSlide } from '@splidejs/react-splide'
import '@splidejs/react-splide/css'

// ─── Emojis Categories Static Data ──────────────────────────────────────────────────
const FILTER_CATEGORIES = [
  { label: 'All', value: '', emoji: '' },
  { label: 'Home & Kitchen', value: 'Home & Kitchen', emoji: '🍳' },
  { label: 'Fashion', value: 'Fashion', emoji: '👗' },
  { label: 'Electronics', value: 'Electronics', emoji: '⌚️' },
  { label: 'Beauty & Personal Care', value: 'Beauty & Personal Care', emoji: '💄' },
  { label: 'Tools & Home Improvements', value: 'Tools & Home Improvements', emoji: '🔧' },
  { label: 'Toys & Games', value: 'Toys & Games', emoji: '🧸' },
  { label: 'Patio & Garden', value: 'Patio & Garden', emoji: '🪴' },
  { label: 'Baby & Products', value: 'Baby & Products', emoji: '🍼' },
  { label: 'Health & Household', value: 'Health & Household', emoji: '🍵' },
  { label: 'Food & Grocery', value: 'Food & Grocery', emoji: '🍜' },
  { label: 'Sports & Outdoors', value: 'Sports & Outdoors', emoji: '⚽️' },
  { label: 'Automotive', value: 'Automotive', emoji: '🚗' },
  { label: 'Pets Supplies', value: 'Pets Supplies', emoji: '🐶' },
  { label: 'Office Products', value: 'Office Products', emoji: '🖌️' },
] as const

const DEFAULT_FILTERS = {
  category: '',
}

const SPLIDE_CATEGORY_OPTIONS = {
  drag: 'free',
  autoWidth: true,
  gap: '0.625rem',
  pagination: false,
  arrows: false,
  rewind: false,
  clones: 0,
} as const

// Pure function — calls suggest-for-you API (Firebase API uses 0-based page indices)
function buildExploreUrl(page: number, category: string = ''): string {
  const p = new URLSearchParams({ 
    page: String(page - 1),
    pageSize: '60'
  })
  if (category) {
    p.append('category', category)
  }
  return `/api/suggest-for-you?${p}`
}

// O(1) dedup using a Set
function dedup<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  return items.filter(item => {
    if (seen.has(item.id)) return false
    seen.add(item.id); return true
  })
}

// ─── ExploreSection ───────────────────────────────────────────────────────────
export default function ExploreSection({ showHeader = true }: { showHeader?: boolean }) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [deals, setDeals] = useState<any[]>(() => dedup(clientCache.get('explore-deals') || []))
  const [page,  setPage]  = useState<number>(clientCache.get('explore-page') || 1)
  const [isLoading,     setIsLoading]     = useState(!clientCache.has('explore-deals'))
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore,       setHasMore]       = useState(clientCache.get('explore-has-more') ?? true)

  // Autocomplete search states
  const [searchInput, setSearchInput] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const [filters, setFilters] = useState<typeof DEFAULT_FILTERS>({
    category: searchParams.get('category') || '',
  })

  // Dynamic scroll shadow states for categories
  const [showLeftShadow, setShowLeftShadow] = useState(false)
  const [showRightShadow, setShowRightShadow] = useState(true)

  const handleSplideScroll = useCallback((splide: any) => {
    setShowLeftShadow(splide.index > 0)
    const end = splide.Components.Controller?.getEnd() || 0
    setShowRightShadow(splide.index < end)
  }, [])

  // Fetch search suggestions
  useEffect(() => {
    if (searchInput.trim().length < 2) {
      setSuggestions([])
      return
    }

    const delayDebounceFn = setTimeout(() => {
      fetch(`/api/search_suggestions?input=${encodeURIComponent(searchInput.trim())}`)
        .then(res => res.json())
        .then(data => {
          const list = Array.isArray(data) ? data : (data.suggestions || data.data || [])
          setSuggestions(list)
        })
        .catch(err => console.error('Failed to fetch suggestions:', err))
    }, 150)

    return () => clearTimeout(delayDebounceFn)
  }, [searchInput])

  // Handle outside click for suggestions dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchSubmit = (query: string) => {
    if (!query.trim()) return
    setShowSuggestions(false)
    router.push(`/search?query=${encodeURIComponent(query.trim())}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(searchInput)
    }
  }

  // Fetch suggested deals on page load / category change / filters reset
  useEffect(() => {
    setIsLoading(true)
    fetch(buildExploreUrl(1, filters.category))
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => {
        const raw       = Array.isArray(data) ? data : (data.deals || [])
        const formatted = dedup(raw.map((item: any, i: number) => formatDeal(item, i)))
        const more      = raw.length >= 20

        setDeals(formatted)
        setPage(1)
        setHasMore(more)
        clientCache.set('explore-deals',    formatted)
        clientCache.set('explore-page',     1)
        clientCache.set('explore-has-more', more)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [filters.category])

  const loadMore = useCallback(async () => {
    setIsLoadingMore(true)
    const next = page + 1
    try {
      const r    = await fetch(buildExploreUrl(next, filters.category))
      if (!r.ok) throw new Error()
      const data = await r.json()
      const raw  = Array.isArray(data) ? data : (data.deals || [])
      const more = raw.length >= 20

      const freshFormatted = raw.map((item: any, i: number) => formatDeal(item, i))
      setDeals(prev => dedup([...prev, ...freshFormatted]))
      setPage(next)
      setHasMore(more)
    } catch (_) {
    } finally {
      setIsLoadingMore(false)
    }
  }, [page, filters.category])

  const updateFilter = useCallback(<K extends keyof typeof DEFAULT_FILTERS>(patch: Pick<typeof DEFAULT_FILTERS, K>) => {
    setFilters(p => ({ ...p, ...patch }))
  }, [])

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), [])

  return (
    <div className={`max-w-[1280px] mx-auto px-4 pb-16 sm:pb-8 border-t border-zinc-100 sm:border-none ${showHeader ? 'pt-4 sm:pt-8' : 'pt-0 sm:pt-0'}`}>
      <div className="mb-6 sm:mb-8 space-y-6">
        {showHeader && (
          <div className="text-center sm:text-left">
            <h2 className="text-xl md:text-2xl font-bold text-[#111827]">Suggest for You</h2>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">Amazing handpicked deals tailored just for you</p>
          </div>
        )}
        
        {/* Full Width Search Bar with fully rounded corners */}
        <div ref={searchContainerRef} className="relative w-full z-[100]">
          <div className="relative flex items-center w-full h-11 md:h-12 bg-white rounded-full border border-zinc-200 shadow-sm focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100 transition-all overflow-hidden">
            <div className="pl-4 text-zinc-400">
              <Search className="size-4 md:size-5" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search deals, brands, or products..."
              className="w-full h-full px-3 text-sm text-zinc-800 bg-transparent outline-none placeholder:text-zinc-400 font-medium"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('')
                  setSuggestions([])
                }}
                className="p-1.5 mr-2 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-all cursor-pointer"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown List */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.15 }}
                className="absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden max-h-[300px] overflow-y-auto z-[101]"
              >
                <div className="py-2">
                  {suggestions.map((item, index) => {
                    const text = typeof item === 'string' 
                      ? item 
                      : (item.query || item.name || item.title || item.keyword || String(item))
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setSearchInput(text)
                          handleSearchSubmit(text)
                        }}
                        className="w-full text-left px-5 py-3 hover:bg-orange-50/50 text-sm md:text-base text-zinc-700 font-medium hover:text-orange-600 border-b border-zinc-50 last:border-0 transition-colors flex items-center gap-3"
                      >
                        <Search className="size-4 text-zinc-400 shrink-0" />
                        <span>{text}</span>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Premium Emojis Categories Selector using SplideJS Slider with left & right scroll shadow overlays */}
        <div className="relative w-full py-1 overflow-hidden">
          {/* Left Scroll Shadow - dynamic */}
          {showLeftShadow && (
            <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-[#F9FAFB] via-[#F9FAFB]/70 to-transparent z-10 pointer-events-none transition-opacity duration-300" />
          )}
          
          {/* Right Scroll Shadow - dynamic */}
          {showRightShadow && (
            <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[#F9FAFB] via-[#F9FAFB]/70 to-transparent z-10 pointer-events-none transition-opacity duration-300" />
          )}
          
          <div className="category-slider">
            <Splide 
              options={SPLIDE_CATEGORY_OPTIONS}
              onMoved={handleSplideScroll}
              onActive={handleSplideScroll}
              onMounted={handleSplideScroll}
            >
              {/* @ts-ignore */}
              {FILTER_CATEGORIES.map(cat => {
                const isActive = filters.category === cat.value
                return (
                  <SplideSlide key={cat.label}>
                    <button
                      onClick={() => updateFilter({ category: cat.value })}
                      className={`flex items-center gap-1.5 px-4 h-9 rounded-full font-bold text-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-primary text-white shadow-md shadow-orange-500/10'
                          : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300'
                      }`}
                    >
                      {cat.emoji && <span className="text-base leading-none">{cat.emoji}</span>}
                      <span>{cat.label}</span>
                    </button>
                  </SplideSlide>
                )
              })}
            </Splide>
          </div>
        </div>
      </div>

      <div className="relative w-full min-h-[400px]">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 8 }, (_, i) => <DealCardSkeleton key={i} />)}
          </div>
        ) : deals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-zinc-500 font-medium">No tailored suggestions found for this category.</p>
            <Button size="sm" variant="flat" color="primary" className="mt-4" onPress={resetFilters}>Clear Filters</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {deals.map(deal => (
              <div key={deal.id} style={{ contain: 'content' }}>
                <DealCard deal={deal} />
              </div>
            ))}
          </div>
        )}
      </div>

      {!isLoading && hasMore && deals.length > 0 && (
        <div className="flex justify-center mt-10">
          <Button
            onPress={loadMore}
            isLoading={isLoadingMore}
            spinner={<Spinner color="current" size="sm" />}
            spinnerPlacement="start"
            className="px-12 h-12 font-bold text-white bg-primary rounded-full shadow-lg"
          >
            Load More Suggestions
          </Button>
        </div>
      )}
    </div>
  )
}
