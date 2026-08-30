import { Metadata } from 'next'
import React from 'react'
import { notFound } from "next/navigation"
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import BrandProductGrid from "./BrandProductGrid"

export const dynamic = 'force-dynamic'

interface Brand {
  brand_name: string
  category: string
  color: string
  deals_count: number
  domain: string
  slug: string
}

async function getBrandData(slug: string): Promise<Brand | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/brands`, { next: { revalidate: 259200 } })
    if (!res.ok) return null
    
    const brands: Brand[] = await res.json()
    const brand = brands.find(b => b.slug === slug)
    
    if (brand) {
      // Capitalize first letter of brand name
      brand.brand_name = brand.brand_name.charAt(0).toUpperCase() + brand.brand_name.slice(1)
      return brand
    }
    return null
  } catch (error) {
    console.error("Error fetching brand data:", error)
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const brand = await getBrandData(slug)

  if (!brand) return { title: 'Brand Not Found' }

  return {
    title: `${brand.brand_name} Coupons & Promo Codes | Verified Deals`,
    description: `Save with the latest ${brand.brand_name} coupons, promo codes, and handpicked deals. Browse verified offers for ${brand.brand_name} products.`,
    openGraph: {
      title: `${brand.brand_name} Coupons & Deals | Azon Deal`,
      description: `Get the best discounts on ${brand.brand_name}. Updated daily with verified promo codes.`,
    }
  }
}

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const brand = await getBrandData(slug)

  if (!brand) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-zinc-50 pb-20">
      <div className="max-w-[1280px] mx-auto px-4 pt-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm font-medium text-zinc-500 mb-6 md:mb-8">
          <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
          <ChevronRight size={14} className="text-zinc-300" />
          <Link href="/brands" className="hover:text-zinc-900 transition-colors">Brands</Link>
          <ChevronRight size={14} className="text-zinc-300" />
          <span className="text-zinc-900">{brand.brand_name}</span>
        </nav>

        {/* Premium Header Section */}
        <div className="mb-8 md:mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-3">
                Verified Brand
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-zinc-900 tracking-tight">
                {brand.brand_name} <span className="text-primary">Coupons & Promo Codes</span>
              </h1>
              <div className="h-1.5 w-16 bg-primary mt-3 rounded-full" />
              <p className="text-zinc-500 mt-4 max-w-xl font-medium text-base leading-relaxed">
                Discover the latest promo codes, coupons, and discounts for {brand.brand_name}. 
                Every deal is verified to ensure you save big on your favorite products.
              </p>
            </div>
            
            {brand.domain && (
              <a 
                href={`https://${brand.domain}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 h-12 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-sm font-bold hover:bg-zinc-50 transition-all shadow-sm group whitespace-nowrap"
              >
                Visit {brand.brand_name}
                <ChevronRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </a>
            )}
          </div>
        </div>

        {/* Product Grid - Client Side Fetching */}
        <div className="relative z-10">
          <BrandProductGrid brandName={brand.brand_name} />
        </div>
      </div>
    </main>
  )
}
