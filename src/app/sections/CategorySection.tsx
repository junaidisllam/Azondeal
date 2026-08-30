'use client'

/**
 * CategorySection — Refactored to match requested design (Splide on Desktop, Native on Mobile).
 *
 * Optimizations:
 *  • Stabilized Splide options to prevent re-initialization.
 *  • Uses optimized BlurImage from components.
 *  • Added functional links mapping to explore categories.
 *  • contentVisibility: auto on mobile list for performance.
 */

import React from 'react'
import Link from 'next/link'
import { BlurImage } from '@/components/BlurImage'

// @ts-expect-error: Splide types
import { Splide, SplideSlide } from '@splidejs/react-splide'
import '@splidejs/react-splide/css'
 
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
  },
} as const
 
interface Category {
  name: string
  image: string | null
  href: string
}

export default function CategorySection({ initialCategories }: { initialCategories?: Category[] }) {
  const categories = initialCategories || []

  if (!categories || categories.length === 0) return null

  return (
    <div className="max-w-[1280px] mx-auto px-4 mt-4 mb-10">
      <h2 className="text-xl md:text-2xl font-bold text-[#111827] mb-6">Shop by Category</h2>

      {/* Desktop Categories (Splide Slider) */}
      <div className="hidden sm:block category-slider relative">
        <Splide options={SPLIDE_OPTIONS}>
          {categories.map((cat) => (
            <SplideSlide key={cat.name}>
              <Link href={cat.href} className="flex flex-col items-center cursor-pointer group pb-2">
                <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden border-2 border-white shadow-md sm:group-hover:shadow-lg sm:group-hover:border-primary sm:transition-all sm:duration-300 bg-zinc-50">
                  {cat.image ? (
                    <BlurImage
                      src={cat.image}
                      alt={cat.name}
                      className="object-cover object-center"
                      sizes="250px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-300">
                      <span className="text-[10px] font-bold uppercase">{cat.name}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                </div>
              </Link>
            </SplideSlide>
          ))}
        </Splide>
      </div>

      {/* Mobile Categories (Native Scroll) */}
      <div className="sm:hidden relative">
        <div
          className="flex gap-3 pb-2 overflow-x-auto snap-x snap-mandatory no-scrollbar w-full"
          style={{ contentVisibility: 'auto', containIntrinsicSize: '0 100px' }}
        >
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="flex flex-col items-center cursor-pointer min-w-[160px] snap-center"
            >
              <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden border border-zinc-100 shadow-sm active:scale-[0.98] transition-transform bg-zinc-50">
                {cat.image ? (
                  <BlurImage
                    src={cat.image}
                    alt={cat.name}
                    className="object-cover object-center"
                    sizes="160px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-300">
                    <span className="text-[8px] font-bold uppercase">{cat.name}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
