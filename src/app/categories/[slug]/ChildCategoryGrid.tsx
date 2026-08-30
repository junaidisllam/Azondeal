'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BlurImage } from '@/components/BlurImage'

export default function ChildCategoryGrid({ childrenCategories }: { childrenCategories: any[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 lg:gap-8">
      {childrenCategories.map((child, index) => {
        const displayImage = child.imageSmall || child.imageMedium || child.imageLarge || "/image/placeholder.jpg"
        
        return (
          <motion.div
            key={child.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: index * 0.05,
              duration: 0.5,
              ease: "easeOut"
            }}
          >
            <Link
              href={`/${child.slug}-coupons`}
              className="group block relative aspect-[9/16] rounded-2xl overflow-hidden bg-white border border-zinc-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
            >
              <BlurImage
                src={displayImage}
                alt={child.name}
                className="transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                objectFit="cover"
              />
              
              {/* Optional: Add a subtle overlay for consistency */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}
