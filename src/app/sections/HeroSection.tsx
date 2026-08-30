'use client'

/**
 * HeroSection — Refactored to Masonry-style Grid (Desktop) and Horizontal Scroll (Mobile).
 *
 * Optimizations:
 *  • Uses optimized PromoCard and BlurImage from components.
 *  • Priority hints on top-of-fold images for better LCP.
 *  • Memoized data merging to prevent recalculation on every render.
 *  • Native snap scroll for mobile (no JS slider overhead).
 */

import React, { useMemo } from 'react'
import Link from 'next/link'
import { PromoCard } from '@/components/DealCard'
import { BlurImage } from '@/components/BlurImage'

const DEFAULT_PROMO_CARDS = [
  { desktop: "/image/1.jpg", mobile: "/image/1 - mobile.jpg", alt: "Household Essentials", ratio: "aspect-square",   type: "square", link: "" },
  { desktop: "/image/2.jpg", mobile: "/image/2 - mobile.jpg", alt: "Top Picks",            ratio: "aspect-video",   type: "video",  link: "" },
  { desktop: "/image/5.jpg", mobile: "/image/5 - mobile.jpg", alt: "Toys & Games",         ratio: "aspect-[21/9]",  type: "wide",   link: "" },
  { desktop: "/image/3.jpg", mobile: "/image/3 - mobile.jpg", alt: "Giveaway",             ratio: "aspect-[8/9]",   type: "tall",   link: "" },
  { desktop: "/image/6.jpg", mobile: "/image/6 - mobile.jpg", alt: "Amazon Promo Codes",   ratio: "aspect-video",   type: "video",  link: "" },
  { desktop: "/image/4.jpg", mobile: "/image/4 - mobile.jpg", alt: "Favorite Brands",      ratio: "aspect-square",   type: "square", link: "" },
]

interface HeroSectionProps {
  initialSlides?: any[]
}

export default function HeroSection({ initialSlides = [] }: HeroSectionProps) {
  // Merge database slides with defaults — memoized for performance
  const slides = useMemo(() => {
    const mapped = initialSlides.map((s, i) => ({
      desktop: s.desktop,
      mobile:  s.mobile,
      alt:     s.alt,
      link:    s.link,
      ratio:   DEFAULT_PROMO_CARDS[i]?.ratio || "aspect-square",
      type:    DEFAULT_PROMO_CARDS[i]?.type  || "square"
    }))

    return mapped.length < 6
      ? [...mapped, ...DEFAULT_PROMO_CARDS.slice(mapped.length)]
      : mapped.slice(0, 6)
  }, [initialSlides])

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-4 md:py-8">
      {/* Mobile View: Horizontal Scroll (Optimized with CSS Snap) */}
      <div className="lg:hidden relative pb-4">
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 no-scrollbar w-full">
          {slides.map((card, index) => (
            <div key={index} className="min-w-[85%] sm:min-w-[70%] snap-center">
              {card.link?.trim() ? (
                <Link
                  href={card.link}
                  className="block w-full h-full relative aspect-[4/5] bg-zinc-100 overflow-hidden rounded-[24px] shadow-sm active:scale-[0.98] transition-transform"
                >
                  <BlurImage
                    src={card.mobile}
                    alt={card.alt}
                    className="object-cover"
                    priority={index < 1} // Only first mobile slide gets priority
                    sizes="(max-width: 639px) 90vw, 400px"
                  />
                </Link>
              ) : (
                <div className="relative w-full aspect-[4/5] bg-zinc-100 overflow-hidden rounded-[24px] shadow-sm">
                  <BlurImage
                    src={card.mobile}
                    alt={card.alt}
                    className="object-cover"
                    priority={index < 1}
                    sizes="(max-width: 639px) 90vw, 400px"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Desktop View: Masonry-style Grid */}
      <div className="hidden lg:grid grid-cols-3 gap-6 items-start">
        {/* Column 1 */}
        <div className="flex flex-col gap-6">
          <PromoCard
            desktop={slides[0].desktop}
            mobile={slides[0].mobile}
            alt={slides[0].alt}
            aspectRatio={slides[0].ratio}
            link={slides[0].link}
            priority
          />
          <PromoCard
            desktop={slides[1].desktop}
            mobile={slides[1].mobile}
            alt={slides[1].alt}
            aspectRatio={slides[1].ratio}
            link={slides[1].link}
          />
        </div>

        {/* Column 2 */}
        <div className="flex flex-col gap-6">
          <PromoCard
            desktop={slides[2].desktop}
            mobile={slides[2].mobile}
            alt={slides[2].alt}
            aspectRatio={slides[2].ratio}
            link={slides[2].link}
            priority
          />
          <PromoCard
            desktop={slides[3].desktop}
            mobile={slides[3].mobile}
            alt={slides[3].alt}
            aspectRatio={slides[3].ratio}
            link={slides[3].link}
          />
        </div>

        {/* Column 3 */}
        <div className="flex flex-col gap-6">
          <PromoCard
            desktop={slides[4].desktop}
            mobile={slides[4].mobile}
            alt={slides[4].alt}
            aspectRatio={slides[4].ratio}
            link={slides[4].link}
            priority
          />
          <PromoCard
            desktop={slides[5].desktop}
            mobile={slides[5].mobile}
            alt={slides[5].alt}
            aspectRatio={slides[5].ratio}
            link={slides[5].link}
          />
        </div>
      </div>
    </div>
  )
}
