'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BlurImage } from '@/components/BlurImage'

interface Category {
  id: number
  name: string
  slug: string
  imageLarge?: string | null
  imageMedium?: string | null
  imageSmall?: string | null
}

export default function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
      {categories.map((category, index) => (
        <CategoryCard key={category.id} category={category} index={index} />
      ))}
    </div>
  )
}

function CategoryCard({ category, index }: { category: Category; index: number }) {
  const displayImage =
    category.imageSmall ||
    category.imageMedium ||
    category.imageLarge ||
    '/image/placeholder.jpg'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: 'easeOut' }}
    >
      <Link
        href={`/categories/${category.slug}`}
        className="group block relative aspect-[12/5] rounded-xl overflow-hidden bg-zinc-100 shadow-sm hover:shadow-md transition-shadow"
      >
        {/* Image with subtle zoom on hover */}
        <BlurImage
          src={displayImage}
          alt={category.name}
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          objectFit="cover"
        />

        {/* Subtle dark scrim on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300" />

        {/* Arrow badge — appears on hover */}
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 shadow-sm z-20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3.5 h-3.5 text-zinc-800"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15M19.5 4.5H8.25M19.5 4.5v11.25" />
          </svg>
        </div>
      </Link>
    </motion.div>
  )
}
