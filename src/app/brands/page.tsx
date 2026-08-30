'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronRight, ChevronLeft } from 'lucide-react'
import { Skeleton } from "@heroui/skeleton"
import Link from 'next/link'

interface Brand {
  brand_name: string
  category: string
  color: string
  deals_count: number
  domain: string
  slug: string
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch('/api/brands')
        const data = await response.json()
        setBrands(data)
      } catch (error) {
        console.error('Error fetching brands:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchBrands()
  }, [])

  // Group brands by their first letter
  const groupedBrands = useMemo(() => {
    const filtered = brands.filter(brand => 
      brand.brand_name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const groups: { [key: string]: Brand[] } = {}
    
    filtered.sort((a, b) => a.brand_name.localeCompare(b.brand_name)).forEach(brand => {
      const firstChar = brand.brand_name.charAt(0).toUpperCase()
      const key = /[A-Z]/.test(firstChar) ? firstChar : '#'
      
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(brand)
    })

    return groups
  }, [brands, searchQuery])

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("")
  const availableLetters = Object.keys(groupedBrands)

  const scrollToLetter = (letter: string) => {
    const element = document.getElementById(`letter-${letter}`)
    if (element) {
      const yOffset = -100 // Space for sticky nav if needed
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  const fadeInUp = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[1280px] mx-auto px-4 py-8">
        
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm font-medium text-zinc-500 mb-12">
          <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
          <ChevronRight size={14} className="text-zinc-300" />
          <span className="text-zinc-900">Brands</span>
        </nav>

        {/* Header Section */}
        <div className="max-w-4xl mb-12">
          <h1 className="text-4xl font-black text-zinc-900 mb-8">All brands</h1>
          
          <div className="relative max-w-lg">
            <input 
              type="text"
              placeholder="Search brands"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-6 bg-zinc-50 border border-zinc-100 rounded-full outline-none focus:border-primary focus:bg-white transition-all text-zinc-700 font-medium"
            />
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          </div>
        </div>

        {/* Alphabet Navigation */}
        {!searchQuery && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 mb-16 border-b border-zinc-100 pb-8 overflow-x-auto no-scrollbar">
            {alphabet.map((letter) => {
              const isAvailable = availableLetters.includes(letter)
              return (
                <button
                  key={letter}
                  onClick={() => isAvailable && scrollToLetter(letter)}
                  disabled={!isAvailable}
                  className={`text-sm font-black transition-colors ${
                    isAvailable 
                      ? 'text-zinc-900 hover:text-primary cursor-pointer' 
                      : 'text-zinc-300 cursor-not-allowed'
                  }`}
                >
                  {letter}
                </button>
              )
            })}
          </div>
        )}

        {/* Content Section */}
        {isLoading ? (
          <div className="space-y-12">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-12">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10 border-t border-zinc-100 pt-8">
                  {[...Array(8)].map((_, j) => (
                    <div key={j} className="flex items-center justify-between p-2">
                      <div className="space-y-3 w-full">
                        <Skeleton className="w-3/4 h-5 rounded-lg" />
                        <Skeleton className="w-1/2 h-3 rounded-lg" />
                      </div>
                      <Skeleton className="w-4 h-4 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-20">
            {alphabet.map((letter) => {
              const brandsInGroup = groupedBrands[letter]
              if (!brandsInGroup) return null

              return (
                <motion.section 
                  key={letter} 
                  id={`letter-${letter}`}
                  {...fadeInUp}
                  className="scroll-mt-32"
                >
                  <h2 className="text-2xl font-black text-zinc-900 mb-8">{letter}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10 border-t border-zinc-100 pt-8">
                    {brandsInGroup.map((brand) => (
                      <Link 
                        key={brand.slug} 
                        href={`/brand/${brand.slug}`}
                        className="group flex items-center justify-between p-2 -m-2 rounded-xl hover:bg-zinc-50 transition-all duration-200"
                      >
                        <div className="min-w-0">
                          <h3 className="font-bold text-zinc-900 group-hover:text-primary transition-colors truncate">
                            {brand.brand_name}
                          </h3>
                          <p className="text-xs font-medium text-zinc-500 mt-1">
                            {brand.deals_count.toLocaleString()} deals
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-zinc-300 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                      </Link>
                    ))}
                  </div>
                </motion.section>
              )
            })}

            {Object.keys(groupedBrands).length === 0 && (
              <div className="text-center py-24">
                <p className="text-zinc-500 font-medium">No brands found matching "{searchQuery}"</p>
                <button 
                  onClick={() => setSearchQuery("")}
                  className="mt-4 text-primary font-bold hover:underline"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
