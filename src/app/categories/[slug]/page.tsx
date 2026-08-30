import { Metadata } from 'next'
import React from 'react'
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from 'next/link'
import { FolderTree } from 'lucide-react'
import { BlurImage } from '@/components/BlurImage'
import ChildCategoryGrid from "./ChildCategoryGrid"

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const category = await db.category.findUnique({
    where: { slug },
    select: {
      name: true,
      seoTitle: true,
      seoDescription: true,
      seoKeywords: true,
      imageMedium: true,
      imageLarge: true
    }
  })

  if (!category) return { title: 'Category Not Found' }

  const title = category.seoTitle || `${category.name} Coupons & Deals | Browse Subcategories`
  const description = category.seoDescription || `Discover the best ${category.name} coupons and subcategories. Verified deals and promo codes for ${category.name} updated daily.`
  const keywords = category.seoKeywords || `${category.name} subcategories, ${category.name} deals, ${category.name} coupons`
  const seoImage = category.imageMedium || category.imageLarge

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `https://azondeal.com/categories/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://azondeal.com/categories/${slug}`,
      images: seoImage ? [{ url: seoImage, width: 800, height: 400, alt: category.name }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: seoImage ? [seoImage] : [],
    },
  }
}

export default async function ChildCategoriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const parentCategory = await db.category.findUnique({
    where: { slug },
    include: {
      other_category: {
        orderBy: {
          name: 'asc'
        }
      }
    }
  })

  if (!parentCategory) {
    notFound()
  }

  const hasChildren = parentCategory.other_category.length > 0
  const desktopBanner = parentCategory.imageLarge || "/image/placeholder.jpg"
  const mobileBanner = parentCategory.imageMedium || parentCategory.imageLarge || "/image/placeholder.jpg"

  const title = parentCategory.seoTitle || `${parentCategory.name} Coupons & Deals | Browse Subcategories`
  const description = parentCategory.seoDescription || `Discover the best ${parentCategory.name} coupons and subcategories. Verified deals and promo codes for ${parentCategory.name} updated daily.`

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
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": parentCategory.name,
        "item": `https://azondeal.com/categories/${parentCategory.slug}`
      }
    ]
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": title,
    "description": description,
    "url": `https://azondeal.com/categories/${slug}`,
    "mainEntity": {
      "@type": "ItemList",
      "name": `${parentCategory.name} Subcategories`,
      "itemListElement": parentCategory.other_category.map((child, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": child.name,
        "url": `https://azondeal.com/categories/${child.slug}`
      }))
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-[1280px] mx-auto px-4">
        {/* Category Banner Image - Responsive */}
        <div className="relative w-full aspect-[2/1] md:aspect-[5.7/1] rounded-2xl overflow-hidden mb-8 md:mb-16 shadow-lg border border-zinc-100 bg-white">
          {/* Desktop Image */}
          <div className="hidden md:block absolute inset-0">
            <BlurImage
              src={desktopBanner}
              alt={parentCategory.name}
              priority
              className="object-cover"
              sizes="100vw"
              objectFit="cover"
            />
          </div>
          {/* Mobile Image */}
          <div className="block md:hidden absolute inset-0">
            <BlurImage
              src={mobileBanner}
              alt={parentCategory.name}
              priority
              className="object-cover"
              sizes="100vw" 
              objectFit="cover"
            />
          </div>
        </div>

        <div className="mb-10">
          <h1 className="text-xl md:text-3xl font-black text-zinc-900 tracking-tight">
            Explore <span className="text-primary">{parentCategory.name}</span> Subcategories
          </h1>
          <div className="h-1.5 w-20 bg-primary mt-3 mb-4 rounded-full" />
          <p className="text-zinc-500 max-w-2xl text-sm md:text-base leading-relaxed">
            {parentCategory.seoDescription || `Discover all subcategories under ${parentCategory.name}. Browse verified coupons and exclusive deals for each category.`}
          </p>
        </div>

        {hasChildren ? (
          <ChildCategoryGrid childrenCategories={parentCategory.other_category} />
        ) : (
          <div className="bg-white rounded-[3rem] p-20 text-center border border-zinc-100 shadow-sm">
            <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <FolderTree size={40} className="text-zinc-300" />
            </div>
            <h2 className="text-2xl font-black text-zinc-900 mb-2">No sub-categories found</h2>
            <p className="text-zinc-500 mb-8">This category doesn't have any nested sub-categories yet.</p>
            <Link
              href={`/search?category=${parentCategory.slug}`}
              className="inline-flex h-14 px-10 items-center justify-center rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 hover:scale-105 transition-all"
            >
              View All Deals in {parentCategory.name}
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
