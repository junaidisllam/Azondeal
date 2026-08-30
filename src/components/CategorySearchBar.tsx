'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Clock, X, TrendingDown } from "lucide-react"
import { useRouter, usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'

interface CategorySearchBarProps {
  categoryName: string
}

const TRENDING_SEARCHES = ["phone case", "flashlight", "jacket", "sports bra", "blender", "camping tent"]

export default function CategorySearchBar({ categoryName }: CategorySearchBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const searchRef = useRef<HTMLDivElement>(null)

  // Load recent searches
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse recent searches', e)
      }
    }
  }, [])

  // Debounced suggestions fetch
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions(null)
      return
    }

    setIsLoading(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/search_suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        })
        if (res.ok) {
          setSuggestions(await res.json())
        }
      } catch { /* silent */ } finally {
        setIsLoading(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSuggestionsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchSubmit = useCallback((q: string) => {
    const searchQuery = q.trim()
    if (!searchQuery) return

    // Save to recent searches
    const updated = [searchQuery, ...recentSearches.filter(s => s.toLowerCase() !== searchQuery.toLowerCase())].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))

    // Log to Database (Bypass Prisma Client sync issues with Raw SQL API)
    fetch('/api/search/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: searchQuery, page: pathname }),
      keepalive: true,
    }).catch(e => console.error('Failed to log search history', e))

    setIsSuggestionsOpen(false)
    router.push(`/search?query=${encodeURIComponent(searchQuery)}`)
  }, [recentSearches, router, pathname])

  const removeRecentSearch = (q: string) => {
    const updated = recentSearches.filter(s => s !== q)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  return (
    <div className="absolute left-1/2 -bottom-6 -translate-x-1/2 w-full max-w-2xl px-4 md:px-6 z-20" ref={searchRef}>
      <div className="relative group">
        {/* RGB Gradient Border Backdrop */}
        <div className="absolute -inset-[2px] bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 rounded-xl md:rounded-2xl blur-[5px] opacity-50 group-hover:opacity-100 transition-opacity duration-500" />

        <div className={`relative bg-white rounded-xl md:rounded-2xl shadow-2xl border border-white/10 flex items-center p-1 md:p-1.5 transition-all ${isSuggestionsOpen ? 'ring-2 ring-primary/20' : ''}`}>
          <div className="pl-3 md:pl-4 text-zinc-400">
            <Search size={18} className="md:w-5 md:h-5" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsSuggestionsOpen(true)
            }}
            onFocus={() => setIsSuggestionsOpen(true)}
            placeholder={`Search ${categoryName}...`}
            className="w-full bg-transparent border-none focus:ring-0 outline-none px-2 md:px-4 py-2.5 md:py-3 text-sm md:text-base text-zinc-900 placeholder:text-zinc-400 font-medium"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearchSubmit(query)
              }
            }}
          />
          <button
            onClick={() => handleSearchSubmit(query)}
            className="bg-primary text-white px-4 md:px-8 py-2.5 md:py-3 rounded-lg md:rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 text-xs md:text-sm tracking-wider whitespace-nowrap"
          >
            Search
          </button>
        </div>

        {/* Suggestions Panel */}
        <AnimatePresence>
          {isSuggestionsOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="absolute top-[calc(100%+12px)] left-0 w-full bg-white rounded-2xl md:rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-zinc-100 overflow-hidden"
            >
              <div className="p-4 md:p-6 space-y-6">
                {query.trim() !== '' ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Suggestions</h4>
                      {isLoading && <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
                    </div>
                    <div className="space-y-1">
                      {suggestions?.suggestions?.length > 0 ? (
                        suggestions.suggestions.map((s: string, idx: number) => (
                          <button
                            key={idx}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 rounded-xl transition-colors group text-left"
                            onClick={() => handleSearchSubmit(s)}
                          >
                            <Search size={14} className="text-zinc-400 group-hover:text-primary transition-colors" />
                            <span className="text-sm text-zinc-700 font-medium group-hover:text-zinc-900">{s}</span>
                          </button>
                        ))
                      ) : !isLoading && (
                        <div className="py-4 text-center">
                          <span className="text-zinc-400 text-xs italic">No matching deals for "{query}"</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {recentSearches.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 px-1">Recent Searches</h4>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.map((s) => (
                            <div
                              key={s}
                              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 rounded-full text-xs font-semibold cursor-pointer transition-colors group"
                              onClick={() => handleSearchSubmit(s)}
                            >
                              <Clock size={12} className="text-zinc-400" />
                              <span>{s}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); removeRecentSearch(s) }}
                                className="text-zinc-300 hover:text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 px-1">Trending Now</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                        {TRENDING_SEARCHES.map((s) => (
                          <button
                            key={s}
                            onClick={() => handleSearchSubmit(s)}
                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 rounded-xl text-left transition-colors"
                          >
                            <TrendingDown size={14} className="text-orange-500" />
                            <span className="text-sm text-zinc-700 font-semibold">{s}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
