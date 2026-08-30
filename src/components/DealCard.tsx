'use client'

import React, { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card } from "@heroui/card"
import {
  Heart,
  ShoppingBag,
  Copy,
  Check,
  Star,
  Zap,
  TicketPercent,
} from 'lucide-react'
import { useAuthModal } from '@/context/AuthModalContext'
import { useSettings } from '@/context/SettingsContext'

import { BlurImage } from '@/components/BlurImage'

// ─── Rank badge styles (static — not recreated every render) ──────────────────
const RANK_STYLES: Record<number, string> = {
  1: 'bg-[#FEF3C7] text-[#D97706]',
  2: 'bg-[#F3E8FF] text-[#9333EA]',
  3: 'bg-[#FFEDD5] text-[#EA580C]',
}

function getProductUrl(deal: any, settings: any): string {
  const platform = (deal.store || deal.merchant_name || '').toLowerCase();
  const asin = deal.asin || '';

  if (platform === 'ebay') {
    const parts = asin.split('|');
    const itemId = parts[1] || parts[0];
    const affiliateId = settings.ebay_affiliate_id || '';
    return `https://www.ebay.com/itm/${itemId}${affiliateId ? `?mkevt=1&mkcid=1&mkrid=711-53200-19255-0&campid=${affiliateId}&toolid=10001` : ''}`;
  }
  if (platform === 'walmart') {
    const affiliateId = settings.walmart_affiliate_id || '';
    return `https://www.walmart.com/ip/${asin}${affiliateId ? `?affspc=1&affpublisherid=${affiliateId}` : ''}`;
  }
  if (platform === 'bestbuy' || platform === 'best buy') {
    const affiliateId = settings.bestbuy_affiliate_id || '';
    return `https://www.bestbuy.com/site/${asin}.p${affiliateId ? `?irclickid=&sharedid=&irpid=${affiliateId}` : ''}`;
  }
  if (platform === 'macy\'s' || platform === 'macys') {
    const affiliateId = settings.macys_affiliate_id || '';
    return `https://www.macys.com/shop/product?ID=${asin}${affiliateId ? `&PartnerID=${affiliateId}` : ''}`;
  }
  if (platform === 'newegg') {
    const affiliateId = settings.newegg_affiliate_id || '';
    return `https://www.newegg.com/p/${asin}${affiliateId ? `?Submit=ENE&DEPA=0&Description=${affiliateId}` : ''}`;
  }
  if (platform === 'woot') {
    const affiliateId = settings.woot_affiliate_id || '';
    return `https://www.woot.com/offers/${asin}${affiliateId ? `?utm_campaign=${affiliateId}` : ''}`;
  }
  const amazonId = settings.amazon_affiliate_id || 'azondeal-20';
  return `https://www.amazon.com/dp/${asin}?m=${deal.merchant_id || ''}&smid=${deal.merchant_id || ''}&tag=${amazonId}&th=1`;
}

// ─── DealCard ─────────────────────────────────────────────────────────────────
// Optimizations:
//  • Removed useEffect for isSaved sync — use prop directly as initial state;
//    parent should key the card if it needs to reset.
//  • useRef for save guard instead of state (no extra render).
//  • Stable handleCopy/handleSave with useCallback.
//  • Static rank style map outside component.
//  • Removed unused imports (Trophy, TicketPercent, CheckCircle, ExternalLink,
//    Tag, CardBody, Chip).
//  • containIntrinsicSize set to a realistic value so content-visibility
//    works properly and avoids layout shift during scroll.

export const DealCard = React.memo(function DealCard({
  deal,
  priority,
  isSaved = false,
}: {
  deal: any
  priority?: boolean
  isSaved?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(isSaved)
  const isSaving = useRef(false)
  const { openSignup } = useAuthModal()
  const { settings } = useSettings()

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!deal.promo_code) return
      navigator.clipboard.writeText(deal.promo_code)
      setCopied(true)
      
      // Open affiliate link in new tab
      const targetUrl = getProductUrl(deal, settings)
      const affiliateId = settings.amazon_affiliate_id || 'azondeal-20'
      
      // Log click to database
      fetch('/api/analytics/affiliate-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asin: deal.asin,
          title: deal.title,
          type: 'promo_copy',
          affiliateId,
          merchantId: deal.merchant_id,
          page: window.location.pathname
        }),
        keepalive: true
      }).catch(() => {});
 
      window.open(targetUrl, '_blank')
 
      setTimeout(() => setCopied(false), 2000)
    },
    [deal.promo_code, deal.asin, deal.merchant_id, deal.store, settings],
  )

  const handleSave = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (isSaving.current) return
      isSaving.current = true

      try {
        const res = await fetch('/api/deals/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ asin: deal.asin }),
        })

        if (!res.ok) {
          if (res.status === 401) { openSignup(); return }
          throw new Error('Failed to save')
        }

        setSaved(prev => !prev)
      } catch {
        // silent — could add toast here
      } finally {
        isSaving.current = false
      }
    },
    [deal.asin, openSignup],
  )

  const rating =
    deal.rating != null
      ? typeof deal.rating === 'number'
        ? deal.rating.toFixed(1)
        : Number(deal.rating).toFixed(1)
      : '4.5'

  const reviews =
    deal.reviews != null
      ? typeof deal.reviews === 'number'
        ? deal.reviews.toLocaleString()
        : deal.reviews
      : null

  const storeParam = deal.store || deal.merchant_name || ''
  const detailUrl = `/deal/${deal.asin || deal.id || deal.hash}${storeParam ? `?platform=${encodeURIComponent(storeParam.toLowerCase())}` : ''}`

  return (
    <Link
      href={detailUrl}
      className="block h-full group/card focus:outline-none bg-white border border-zinc-100 rounded-xl overflow-hidden active:scale-[0.98] transition-all duration-200"
      // containIntrinsicSize matches the real rendered height so the browser
      // can reserve space before painting — prevents scroll jank on fast fling.
      style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 320px' }}
    >
      {/* Image area */}
      <div className="relative aspect-[5/4] w-full p-2 bg-white shrink-0 overflow-hidden">
        {deal.rank && (
          <div
            className={`absolute top-1.5 left-1.5 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold shadow-sm ${
              RANK_STYLES[deal.rank as 1 | 2 | 3] ?? RANK_STYLES[3]
            }`}
          >
            Top {deal.rank}
          </div>
        )}

        <button
          className={`absolute top-1.5 right-1.5 z-10 w-8 h-8 rounded-full bg-white/95 flex items-center justify-center transition-all duration-300 shadow-sm border border-zinc-100/50 active:scale-90 ${
            saved ? 'text-red-500 bg-red-50' : 'text-zinc-400 hover:text-red-400 hover:bg-red-50/50'
          }`}
          onClick={handleSave}
          aria-label={saved ? 'Unsave deal' : 'Save deal'}
        >
          <Heart size={16} fill={saved ? 'currentColor' : 'none'} strokeWidth={saved ? 0 : 2.5} />
        </button>

        <div className="relative w-full h-full">
          <BlurImage
            src={deal.image}
            alt={deal.title}
            className="object-contain"
            priority={priority}
          />
        </div>
      </div>

      {/* Content area */}
      <div className="p-2 flex flex-col flex-1 space-y-1.5">
        <div className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
          {deal.store || deal.merchant_name || 'Amazon'}
        </div>

        <h3 className="text-[11px] sm:text-[14px] font-medium text-zinc-800 leading-tight line-clamp-2 min-h-[2.5rem]">
          {deal.title}
        </h3>

        <div className="flex flex-wrap items-center gap-1">
          <span className="bg-[#EF4444] text-white text-[9px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-md">
            {deal.discount}
          </span>
          {deal.hasPromo && (
            <span className="bg-[#ECFDF5] text-[#10B981] text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md">
              Promo
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-[14px] sm:text-[17px] font-bold text-zinc-900">{deal.price}</span>
          <span className="text-[10px] sm:text-[13px] text-zinc-400 line-through">{deal.originalPrice}</span>
        </div>

        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100">
              <Star size={10} fill="#fbbf24" className="text-amber-400" />
              <span className="text-[10px] font-bold text-amber-700">{rating}</span>
            </div>
            {reviews && (
              <span className="text-[10px] font-medium text-zinc-400">({reviews})</span>
            )}
          </div>
          {deal.sold && (
            <span className="text-[9px] font-bold text-[#10B981]">{deal.sold}</span>
          )}
        </div>

        {/* Fixed-height bottom section — keeps cards aligned in a grid */}
        <div className="mt-auto pt-1.5 h-[42px] flex flex-col justify-end">
          {deal.promo_code ? (
            /* Promo code: label sits INSIDE the dashed box to keep total height = 42px */
            <div
              onClick={handleCopy}
              className="flex items-center justify-between bg-orange-50/30 border-2 border-dashed border-primary/50 rounded-lg px-2 cursor-pointer h-[34px]"
            >
              <div className="flex items-center gap-1 min-w-0">
                <TicketPercent size={10} className="text-orange-400 shrink-0" />
                <span className="text-[10px] font-mono font-bold text-zinc-600 truncate">{deal.promo_code}</span>
              </div>
              <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8px] font-bold shrink-0 ml-1 transition-colors ${
                copied
                  ? 'bg-green-100 text-green-600'
                  : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
              }`}>
                {copied ? <Check size={10} /> : <Copy size={10} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5 w-full h-[34px] bg-zinc-900 text-white text-[10px] font-bold rounded-lg group-hover/card:bg-primary transition-colors">
              <Zap size={11} className="fill-current" />
              Get Deal
            </div>
          )}
        </div>
      </div>
    </Link>
  )
})

export const PromoDealCard = DealCard

// ─── Skeletons ────────────────────────────────────────────────────────────────
// Removed nested divs; collapsed into flat structure to reduce DOM depth.

export function DealCardSkeleton() {
  return (
    <div className="flex flex-col bg-white border border-zinc-100 rounded-xl overflow-hidden sm:animate-pulse">
      <div className="w-full aspect-[5/4] bg-zinc-100" />
      <div className="p-2 space-y-2 mt-1">
        <div className="w-1/4 h-2 bg-zinc-100 rounded-lg" />
        <div className="w-full h-3 bg-zinc-100 rounded-lg" />
        <div className="w-3/4 h-3 bg-zinc-100 rounded-lg" />
        <div className="flex gap-2">
          <div className="w-10 h-4 bg-zinc-100 rounded-lg" />
          <div className="w-14 h-4 bg-zinc-100 rounded-lg" />
        </div>
        <div className="flex items-baseline gap-2">
          <div className="w-16 h-5 bg-zinc-100 rounded-lg" />
          <div className="w-10 h-3 bg-zinc-100 rounded-lg" />
        </div>
        <div className="flex justify-end pt-1">
          <div className="w-12 h-2.5 bg-zinc-100 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function PromoDealCardSkeleton() {
  return (
    <div className="flex flex-col bg-white border border-zinc-100 rounded-xl overflow-hidden sm:animate-pulse">
      <div className="w-full aspect-[5/4] bg-zinc-100" />
      <div className="p-2 space-y-2 mt-3">
        <div className="w-1/4 h-2.5 bg-zinc-100 rounded-lg" />
        <div className="w-full h-4 bg-zinc-100 rounded-lg" />
        <div className="w-2/3 h-4 bg-zinc-100 rounded-lg" />
        <div className="flex items-baseline gap-2">
          <div className="w-16 h-6 bg-zinc-100 rounded-lg" />
          <div className="w-12 h-4 bg-zinc-100 rounded-lg" />
        </div>
        <div className="w-full h-10 bg-zinc-50 rounded-lg" />
      </div>
    </div>
  )
}

export function CategorySkeleton() {
  return (
    <div className="w-full sm:animate-pulse">
      <div className="w-full aspect-[21/9] bg-zinc-100 rounded-xl" />
    </div>
  )
}

// ─── PromoCard ────────────────────────────────────────────────────────────────
export function PromoCard({
  desktop,
  mobile,
  alt,
  aspectRatio,
  priority = false,
  link,
}: {
  desktop: string
  mobile: string
  alt: string
  aspectRatio: string
  priority?: boolean
  link?: string
}) {
  const content = (
    <Card
      className={`relative w-full ${aspectRatio} border-none shadow-none bg-transparent overflow-hidden rounded-[24px] cursor-pointer group`}
    >
      {/* Single BlurImage per viewport — avoids loading both at once */}
      <div className="block lg:hidden w-full h-full relative">
        <BlurImage
          src={mobile}
          alt={alt}
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          priority={priority}
          sizes="(max-width: 1023px) 100vw, 33vw"
        />
      </div>
      <div className="hidden lg:block w-full h-full relative">
        <BlurImage
          src={desktop}
          alt={alt}
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          priority={priority}
          sizes="(min-width: 1024px) 33vw, 100vw"
        />
      </div>
    </Card>
  )

  return link?.trim() ? (
    <Link href={link} className="block w-full">{content}</Link>
  ) : content
}

export function PromoCardSkeleton({ aspectRatio }: { aspectRatio: string }) {
  return (
    <Card
      className={`relative w-full ${aspectRatio} border-none shadow-none bg-zinc-200 animate-pulse overflow-hidden rounded-[24px]`}
    />
  )
}
