import { Metadata } from 'next'
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { BlurImage } from "@/components/BlurImage"
import CategoryProductGrid from "./CategoryProductGrid"
import CategorySearchBar from "@/components/CategorySearchBar"

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const categorySlug = slug.replace(/-coupons$/, "")
  
  const category = await db.category.findUnique({
    where: { slug: categorySlug },
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

  const title = category.seoTitle || `${category.name} Coupons & Promo Codes ${new Date().getFullYear()}`
  const description = category.seoDescription || `Get the latest verified ${category.name} coupons and deals. Save more with our handpicked ${category.name} promo codes.`
  const keywords = category.seoKeywords || `${category.name} coupons, ${category.name} promo codes, ${category.name} deals, azon deal`
  const seoImage = category.imageMedium || category.imageLarge

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `https://azondeal.com/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://azondeal.com/${slug}`,
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

export default async function CategoryCouponPage({ params }: PageProps) {
  const { slug } = await params

  // Check if it's a category coupon page (URL ends with -coupons)
  if (!slug.endsWith("-coupons")) {
    notFound()
  }

  // Extract the actual category slug safely
  const categorySlug = slug.replace(/-coupons$/, "")

  // Fetch the category details from DB
  const category = await db.category.findUnique({
    where: { slug: categorySlug },
  })

  if (!category) {
    notFound()
  }

  const searchKeyword = category.searchKeyword || category.name
  const desktopBanner = category.imageLarge || "/image/placeholder.jpg"
  const mobileBanner = category.imageMedium || category.imageLarge || "/image/placeholder.jpg"

  const title = category.seoTitle || `${category.name} Coupons & Promo Codes ${new Date().getFullYear()}`
  const description = category.seoDescription || `Get the latest verified ${category.name} coupons and deals. Save more with our handpicked ${category.name} promo codes.`

  // SEO Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": title,
    "description": description,
    "url": `https://azondeal.com/${slug}`,
    "mainEntity": {
      "@type": "ItemList",
      "name": `${category.name} Deals`,
      "description": `List of current coupons and promo codes for ${category.name}`,
      "itemListElement": [] 
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Premium Hero Banner - Contained */}
      <div className="max-w-[1280px] mx-auto px-4 mt-4 md:mt-8 relative">
        <div className="relative w-full aspect-[2/1] md:aspect-[5.7/1] overflow-hidden bg-zinc-900 rounded-3xl shadow-xl">
          {/* Desktop Image */}
          <div className="hidden md:block absolute inset-0">
            <BlurImage
              src={desktopBanner}
              alt={category.name}
              priority
              objectFit="cover"
              quality={90}
            />
          </div>
          {/* Mobile Image */}
          <div className="block md:hidden absolute inset-0">
            <BlurImage
              src={mobileBanner}
              alt={category.name}
              priority
              objectFit="cover"
              quality={90}
            />
          </div>
        </div>

        {/* Beautiful Floating Search Bar */}
        <CategorySearchBar categoryName={category.name} />
      </div>

      <div className="max-w-[1280px] mx-auto px-4 mt-10 md:mt-16 relative z-10">
        <div className="mb-8">
          <h1 className="text-2xl md:text-4xl font-black text-zinc-900 tracking-tight mb-2">
            Best <span className="text-primary">{category.name}</span> Coupons & Promo Codes
          </h1>
          <p className="text-zinc-500 max-w-2xl text-sm md:text-base leading-relaxed">
            {category.seoDescription || `Discover the latest verified ${category.name} coupons, promo codes, and handpicked deals to help you save more on your favorite brands.`}
          </p>
        </div>

        {/* Product Grid - Client Side Fetching */}
        <CategoryProductGrid 
          searchKeyword={searchKeyword} 
          categoryName={category.name} 
        />
      </div>
    </main>
  )
}
