import { Metadata } from 'next'
import React from 'react'
import { db } from "@/lib/db"
import CategoryGrid from "./CategoryGrid"
import Newsletter from "@/components/Newsletter"

export const metadata: Metadata = {
  title: "All Shopping Categories",
  description: "Browse through our extensive list of shopping categories to find the best deals, coupons, and promo codes. From electronics to fashion, we've got you covered.",
  openGraph: {
    title: "All Shopping Categories | Azon Deal",
    description: "Explore handpicked deals and massive savings across dozens of categories.",
  }
}

export const dynamic = 'force-dynamic'

export default async function CategoriesPage() {
  const motherCategories = await db.category.findMany({
    where: {
      parentId: null
    },
    orderBy: {
      name: 'asc'
    }
  })

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://azondeal.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Categories",
        "item": "https://azondeal.com/categories"
      }
    ]
  }

  return (
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Compact Header */}
      <section className="border-b border-zinc-100 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1.5">
                Shop by Category
              </p>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight leading-tight">
                All Categories
              </h1>
            </div>
            <p className="text-sm text-zinc-400 sm:text-right max-w-xs leading-relaxed">
              {motherCategories.length} categories · Updated daily
            </p>
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <CategoryGrid categories={motherCategories} />
      </section>

      {/* Newsletter */}
      <div className="border-t border-zinc-100">
        <Newsletter />
      </div>
    </main>
  )
}
