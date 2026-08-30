'use client'

import React, { useState, useEffect, useMemo, use } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Star,
  Share2,
  Heart,
  ChevronRight,
  ShoppingBag,
  ShieldCheck,
  Clock,
  Tag,
  Info,
  TicketPercent,
  TrendingDown,
  ChevronLeft,
  Package,
  ExternalLink,
  Percent,
  CheckCircle2,
  AlertCircle,
  X,
  Share,
  MessageCircle,
  Send,
  Link as LinkIcon,
  Copy as CopyIcon,
  Check as CheckIcon,
  RotateCw
} from 'lucide-react'
import { Button } from "@heroui/button"
import { Chip } from "@heroui/chip"
import { DealCard, DealCardSkeleton } from '@/components/DealCard'
import { Skeleton } from "@heroui/skeleton"
import { Card, CardBody } from "@heroui/card"
import { ScrollShadow } from "@heroui/scroll-shadow"
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal"
import { useDisclosure } from "@heroui/use-disclosure"
import { toast } from "@heroui/react"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
// @ts-ignore
import { Splide, SplideSlide } from '@splidejs/react-splide'
import '@splidejs/react-splide/css'
import { clientCache } from '@/lib/cache'
import { useAuthModal } from '@/context/AuthModalContext'
import { useSettings } from '@/context/SettingsContext'

// --- Types ---
interface DealVariant {
  asin: string
  title: string
  image: string
  price: number
  discounted_price: number
  discount_percentage: number
  deal_hash: string
  [key: string]: any
}

interface DealDetail {
  id: number
  asin: string
  title: string
  image: string
  image_ids: string[]
  price: number
  discounted_price: number
  discount_percentage: number
  avg_rating: number
  ratings_count: number
  category: string
  merchant_name: string
  promo_string: string
  has_coupon: boolean
  coupon_value: string
  deal_hash: string
  variants: DealVariant[]
  promo_code?: string
  codes?: string[]
  [key: string]: any
}

function getProductUrl(deal: any, settings: any): string {
  const platform = (deal.merchant_name || '').toLowerCase();
  const asin = deal.asin || '';

  if (platform === 'ebay') {
    const parts = asin.split('|');
    const itemId = parts[1] || parts[0];
    const affiliateId = settings?.ebay_affiliate_id || '';
    return `https://www.ebay.com/itm/${itemId}${affiliateId ? `?mkevt=1&mkcid=1&mkrid=711-53200-19255-0&campid=${affiliateId}&toolid=10001` : ''}`;
  }
  if (platform === 'walmart') {
    const affiliateId = settings?.walmart_affiliate_id || '';
    return `https://www.walmart.com/ip/${asin}${affiliateId ? `?affspc=1&affpublisherid=${affiliateId}` : ''}`;
  }
  if (platform === 'bestbuy' || platform === 'best buy') {
    const affiliateId = settings?.bestbuy_affiliate_id || '';
    return `https://www.bestbuy.com/site/${asin}.p${affiliateId ? `?irclickid=&sharedid=&irpid=${affiliateId}` : ''}`;
  }
  if (platform === 'macy\'s' || platform === 'macys') {
    const affiliateId = settings?.macys_affiliate_id || '';
    return `https://www.macys.com/shop/product?ID=${asin}${affiliateId ? `&PartnerID=${affiliateId}` : ''}`;
  }
  if (platform === 'newegg') {
    const affiliateId = settings?.newegg_affiliate_id || '';
    return `https://www.newegg.com/p/${asin}${affiliateId ? `?Submit=ENE&DEPA=0&Description=${affiliateId}` : ''}`;
  }
  if (platform === 'woot') {
    const affiliateId = settings?.woot_affiliate_id || '';
    return `https://www.woot.com/offers/${asin}${affiliateId ? `?utm_campaign=${affiliateId}` : ''}`;
  }
  const amazonId = settings?.amazon_affiliate_id || 'azondeal-20';
  return `https://www.amazon.com/dp/${asin}?m=${deal.merchant_id || ''}&smid=${deal.merchant_id || ''}&tag=${amazonId}&th=1`;
}

// --- Components ---

function ImageGallery({ images, title, isSaved, onSave, onShare }: { images: string[], title: string, isSaved: boolean, onSave: () => void, onShare: () => void }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const mainSplideRef = React.useRef<any>(null)

  const getFullUrl = (id: string) => {
    if (!id) return undefined
    if (id.startsWith('http')) return id
    return `https://m.media-amazon.com/images/I/${id}._AC_SL1500_.jpg`
  }

  const handleThumbClick = (idx: number) => {
    setActiveIdx(idx)
    if (mainSplideRef.current) {
      mainSplideRef.current.go(idx)
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4 w-full">
      <div className="relative aspect-square bg-white rounded-2xl sm:rounded-3xl border border-zinc-100 overflow-hidden group">
        <Splide
          ref={mainSplideRef}
          options={{
            arrows: false,
            pagination: false,
            type: 'loop',
            speed: 600,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
          }}
          onMoved={(splide: any) => setActiveIdx(splide.index)}
          className="main-image-slider"
        >
          {images.map((id, idx) => (
            <SplideSlide key={id + idx}>
              <div className="aspect-square flex items-center justify-center p-3 sm:p-4 md:p-6">
                <img
                  src={getFullUrl(id)}
                  alt={`${title} - image ${idx + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </SplideSlide>
          ))}
        </Splide>

        {/* Floating Actions */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex flex-col gap-2 sm:gap-3">
          <button
            onClick={onSave}
            className={`size-9 sm:size-10 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 active:scale-90 border
              ${isSaved ? 'bg-red-50 text-red-500 border-red-100' : 'bg-white/90 text-zinc-400 hover:text-red-500 border-zinc-100'}`}
          >
            <Heart size={18} className="sm:w-5 sm:h-5" fill={isSaved ? "currentColor" : "none"} strokeWidth={isSaved ? 0 : 2} />
          </button>
          <button
            onClick={onShare}
            className="size-9 sm:size-10 rounded-full bg-white/90 shadow-lg border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-primary transition-all active:scale-90"
          >
            <Share2 size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
        {images.map((id, idx) => (
          <button
            key={id + idx}
            onClick={() => handleThumbClick(idx)}
            className={`relative flex-shrink-0 w-16 sm:w-20 aspect-square rounded-lg sm:rounded-md overflow-hidden bg-white border-2 transition-all
              ${activeIdx === idx ? 'border-red-500' : 'border-transparent'}`}
          >
            <img
              src={getFullUrl(id)}
              alt={`${title} thumbnail ${idx}`}
              className="w-full h-full object-contain p-1"
            />
          </button>
        ))}
      </div>
    </div>
  )
}

function SimilarDeals({ title, asin, platform, savedAsins = [] }: { title: string, asin: string, platform: string, savedAsins?: string[] }) {
  const [deals, setDeals] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!asin) return

    // 1. Reset state cleanly for the new product ASIN to prevent flicker or caching incorrect data
    setDeals([])
    setIsLoading(true)

    const cacheKey = `similar-${asin}`
    const cachedData = clientCache.get(cacheKey)

    // 2. If valid cache exists, return it instantly and skip unnecessary fetch requests
    if (cachedData && cachedData.length > 0) {
      setDeals(cachedData)
      setIsLoading(false)
      return
    }

    fetch(`/api/similar-deals?id=${encodeURIComponent(asin)}&platform=${encodeURIComponent(platform)}&limit=30`)
      .then(res => res.json())
      .then(data => {
        const raw = Array.isArray(data) ? data : (data.deals || [])
        const formatted = raw.map((item: any, i: number) => ({
          asin: item.asin || item.deal_hash || `sim-${i}`,
          id: item.asin || item.deal_hash || `sim-${i}`,
          title: item.title,
          image: item.image || item.image_url,
          discount: item.discount_percentage ? `${Math.round(item.discount_percentage)}% OFF` : 'Deal',
          price: `$${(item.discounted_price || item.price || 0).toFixed(2)}`,
          originalPrice: `$${(item.list_price || item.price || 0).toFixed(2)}`,
          store: item.merchant_name || 'Amazon',
          promo_code: item.promo_code || (item.codes && item.codes[0]),
          hasPromo: !!(item.promo_code || item.has_promo_code || item.codes?.length > 0),
          rating: item.avg_rating || item.rating,
          reviews: item.ratings_count || item.reviews_count,
          sold: item.bought_past_month > 0 ? `${item.bought_past_month}+ Sold` : undefined
        }))

        clientCache.set(cacheKey, formatted)
        setDeals(formatted)
        setIsLoading(false)
      })
      .catch(err => {
        console.error("SimilarDeals fetch error:", err)
        setIsLoading(false)
      })
  }, [asin, platform])

  if (!isLoading && deals.length === 0) return null

  return (
    <div className="mt-12 sm:mt-16 md:mt-20 mb-6 sm:mb-8 space-y-4 sm:space-y-6 md:space-y-8 w-full overflow-hidden">
      <div className="flex items-center justify-between px-0">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-zinc-900">Similar Products</h2>
      </div>

      <div className="relative w-full">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 w-full">
            {Array.from({ length: 10 }).map((_, i) => (
              <DealCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 w-full">
            {deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} isSaved={savedAsins.includes(deal.asin)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ShareDrawer({ isOpen, onClose, deal }: { isOpen: boolean, onClose: () => void, deal: DealDetail }) {
  const [copied, setCopied] = useState(false)
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareOptions = [
    { name: 'WhatsApp', icon: <MessageCircle />, url: `https://wa.me/?text=${encodeURIComponent(deal.title + ' ' + shareUrl)}`, color: 'bg-[#25D366] text-white' },
    { name: 'Messenger', icon: <Send />, url: `fb-messenger://share/?link=${encodeURIComponent(shareUrl)}`, color: 'bg-[#0084FF] text-white' },
    { name: 'Twitter', icon: <Share />, url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(deal.title)}&url=${encodeURIComponent(shareUrl)}`, color: 'bg-black text-white' },
    { name: 'Telegram', icon: <Send />, url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(deal.title)}`, color: 'bg-[#0088cc] text-white' },
  ]

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onClose}
      placement="center"
      backdrop="blur"
      size="md"
      className="bg-white rounded-[24px] sm:rounded-[32px] mx-3 sm:mx-4"
    >
      <ModalContent className="bg-white border-none shadow-2xl">
        <ModalHeader className="flex flex-col gap-1 text-center border-b border-zinc-100 pb-3 sm:pb-4 pt-5 sm:pt-6">
          <h3 className="text-lg sm:text-xl font-black text-zinc-900">Share this Deal</h3>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium">Spread the savings with your friends!</p>
        </ModalHeader>
        <ModalBody className="py-6 sm:py-8 px-4 sm:px-6">
          <div className="grid grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {shareOptions.map((option) => (
              <a
                key={option.name}
                href={option.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 sm:gap-2 group"
              >
                <div className={`size-12 sm:size-14 ${option.color} rounded-xl sm:rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 active:scale-95`}>
                  {React.cloneElement(option.icon as any, { size: 24, className: "sm:w-7 sm:h-7" })}
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-zinc-600">{option.name}</span>
              </a>
            ))}
          </div>

          <div className="space-y-2 sm:space-y-3">
            <p className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Or Copy Link</p>
            <div className="flex items-center gap-2 p-1.5 bg-zinc-50 rounded-xl sm:rounded-2xl border border-zinc-100">
              <div className="flex-1 px-2 sm:px-3 text-xs sm:text-sm text-zinc-500 truncate font-medium">
                {shareUrl}
              </div>
              <Button
                size="sm"
                onPress={copyToClipboard}
                className={`${copied ? 'bg-emerald-500' : 'bg-zinc-900'} text-white font-bold h-9 sm:h-10 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all text-xs sm:text-sm`}
              >
                {copied ? <CheckIcon size={16} className="sm:w-[18px] sm:h-[18px]" /> : <CopyIcon size={16} className="sm:w-[18px] sm:h-[18px]" />}
                <span className="ml-1.5 sm:ml-2">{copied ? 'Copied' : 'Copy'}</span>
              </Button>
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="pb-5 sm:pb-6 px-4 sm:px-6">
          <Button variant="ghost" onPress={onClose} className="w-full font-bold text-zinc-500 h-11 sm:h-12 rounded-xl text-sm sm:text-base">
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

function ProductSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 animate-pulse">
      <div className="space-y-3 sm:space-y-4">
        <div className="aspect-square bg-zinc-100 rounded-2xl sm:rounded-3xl" />
        <div className="flex gap-2 sm:gap-3 overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="size-14 sm:size-16 bg-zinc-100 rounded-lg sm:rounded-xl flex-shrink-0" />)}
        </div>
      </div>
      <div className="space-y-4 sm:space-y-6">
        <div className="space-y-2 sm:space-y-3">
          <div className="h-3 sm:h-4 w-20 sm:w-24 bg-zinc-100 rounded" />
          <div className="h-8 sm:h-10 w-full bg-zinc-100 rounded" />
          <div className="h-8 sm:h-10 w-3/4 bg-zinc-100 rounded" />
          <div className="h-5 sm:h-6 w-28 sm:w-32 bg-zinc-100 rounded" />
        </div>
        <div className="h-14 sm:h-16 w-full bg-zinc-100 rounded-xl sm:rounded-2xl" />
        <div className="h-28 sm:h-32 w-full bg-zinc-100 rounded-xl sm:rounded-2xl" />
      </div>
    </div>
  )
}

export default function ProductDetailContent({ params, platform, affiliateId }: { params: Promise<{ asin: string }>, platform?: string, affiliateId: string }) {
  const router = useRouter()
  const { asin } = use(params)
  const { data: session } = useSession()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { openSignup } = useAuthModal()
  const { settings } = useSettings()
  const [isSaved, setIsSaved] = useState(false)
  const [allSavedAsins, setAllSavedAsins] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [deal, setDeal] = useState<DealDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [codeCopied, setCodeCopied] = useState(false)

  const handleCopyAndRedirect = () => {
    if (!deal) return;
    const codeToCopy = deal.promo_code || (deal.codes && deal.codes[0]) || (deal.has_coupon && (deal.coupon_value || "COUPON"));
    if (codeToCopy) {
      navigator.clipboard.writeText(codeToCopy);
    }
    setCodeCopied(true);
    toast.success('Promo code copied!');

    // Prepare target URL and tracking details
    const targetUrl = getProductUrl(deal, settings);
    const activeStore = (deal.merchant_name || 'amazon').toLowerCase();
    const trackingId = activeStore === 'ebay' ? settings.ebay_affiliate_id :
                       activeStore === 'walmart' ? settings.walmart_affiliate_id :
                       (activeStore === 'bestbuy' || activeStore === 'best buy') ? settings.bestbuy_affiliate_id :
                       (activeStore === 'macys' || activeStore === 'macy\'s') ? settings.macys_affiliate_id :
                       activeStore === 'newegg' ? settings.newegg_affiliate_id :
                       activeStore === 'woot' ? settings.woot_affiliate_id :
                       settings.amazon_affiliate_id || affiliateId;

    // Log the affiliate click analytics
    fetch('/api/analytics/affiliate-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        asin: deal.asin,
        title: deal.title,
        type: 'promo_copy',
        affiliateId: trackingId,
        merchantId: deal.merchant_id,
        page: window.location.pathname
      }),
      keepalive: true
    }).catch(() => {});

    // Open affiliate link in a new tab after 1.2 seconds
    setTimeout(() => {
      window.open(targetUrl, '_blank');
      setCodeCopied(false);
    }, 1200);
  };

  useEffect(() => {
    async function fetchDetail() {
      try {
        setIsLoading(true)
        const platformQuery = platform ? `?platform=${encodeURIComponent(platform)}` : ''
        const [res, savedRes] = await Promise.all([
          fetch(`/api/deals/detail/${asin}${platformQuery}`),
          fetch('/api/deals/save').then(r => r.json()).catch(() => ({ savedIds: [], savedAsins: [] }))
        ])

        if (!res.ok) throw new Error('Failed to fetch deal details')
        const data = await res.json()

        const dealData = Array.isArray(data) && data.length > 0 ? data[0] : data
        setDeal(dealData)

        if (savedRes.savedAsins) {
          setAllSavedAsins(savedRes.savedAsins)
          if (asin) {
            setIsSaved(savedRes.savedAsins.includes(asin))
          }
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDetail()
  }, [asin])

  const handleSave = async () => {
    if (!session) {
      openSignup()
      return
    }

    if (!deal || isSaving) return

    const prevSaved = isSaved
    setIsSaved(!prevSaved)
    setIsSaving(true)

    try {
      const res = await fetch('/api/deals/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asin: deal.asin || asin,
          dealId: deal.id
        })
      })

      if (!res.ok) throw new Error('Failed to save deal')
      const data = await res.json()
      setIsSaved(data.saved)

      setAllSavedAsins(prev =>
        data.saved ? [...prev, deal.asin || asin] : prev.filter(a => a !== (deal.asin || asin))
      )

      toast.success(data.message || (data.saved ? 'Deal saved to wishlist' : 'Deal removed from wishlist'))
    } catch (err) {
      setIsSaved(prevSaved)
      toast.danger('Something went wrong. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="size-16 sm:size-20 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4 sm:mb-6">
          <AlertCircle size={32} className="sm:w-10 sm:h-10" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Oops! Something went wrong</h2>
        <p className="text-sm sm:text-base text-zinc-500 mt-2 max-w-md px-4">{error}</p>
        <Button
          className="mt-6 sm:mt-8 bg-primary text-white font-bold px-6 sm:px-8 rounded-full h-11 sm:h-12 text-sm sm:text-base"
          onPress={() => router.push('/search')}
        >
          Back to Search
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">
      <div className="max-w-[1200px] mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 w-full">
        {isLoading ? (
          <ProductSkeleton />
        ) : deal ? (
          <>
            {/* Breadcrumb & Share */}
            <div className="flex items-center justify-between mb-4 sm:mb-6 w-full overflow-hidden gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-[13px] font-medium text-zinc-400 min-w-0 flex-1">
                <Link href="/" className="hover:text-zinc-900 shrink-0">Home</Link>
                <ChevronRight size={12} className="sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="uppercase tracking-wider truncate text-[10px] sm:text-[13px]">{deal.category}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onPress={onOpen}
                className="bg-zinc-50 text-zinc-900 font-bold rounded-full border border-zinc-100 hover:bg-zinc-100 transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm"
              >
                <Share size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Share</span>
              </Button>
            </div>

            {/* Main Content Grid */}
            <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-12 items-start w-full min-w-0">
              {/* Left: Image Gallery */}
              <div className="w-full lg:w-[45%] flex-shrink-0">
                <ImageGallery
                  images={deal.image_ids && deal.image_ids.length > 0 ? deal.image_ids : [deal.image]}
                  title={deal.title}
                  isSaved={isSaved}
                  onSave={handleSave}
                  onShare={onOpen}
                />
              </div>

              {/* Right: Product Info */}
              <div className="flex-1 space-y-4 sm:space-y-5 min-w-0 w-full">
                {/* Promo Badge */}
                {(deal.promo_code || (deal.codes && deal.codes.length > 0)) && (
                  <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-xs sm:text-[13px]">
                    <TicketPercent size={14} className="sm:w-4 sm:h-4" />
                    Promo Code
                  </div>
                )}

                {/* Title */}
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-zinc-800 leading-tight break-words">
                  {deal.title}
                </h1>

                {/* Price Section */}
                <div className="flex items-center gap-2.5 sm:gap-3 md:gap-4 flex-wrap">
                  <div className="bg-[#EF4444] text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-sm sm:text-base md:text-lg font-black">
                    -{Math.round(deal.discount_percentage)}%
                  </div>
                  <div className="flex items-baseline gap-1.5 sm:gap-2">
                    <span className="text-xl sm:text-2xl md:text-3xl font-black text-zinc-900">${Number(deal.discounted_price).toFixed(2)}</span>
                    <span className="text-sm sm:text-base md:text-lg text-zinc-400 line-through">${Number(deal.price).toFixed(2)}</span>
                  </div>
                </div>

                {/* Low Price Badge */}
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-orange-50 text-[#EA580C] rounded-lg text-[10px] sm:text-xs font-bold border border-orange-100">
                  <TrendingDown size={12} className="sm:w-3.5 sm:h-3.5" />
                  Verified Low Price
                </div>

                {/* Variations */}
                {(deal.variants || deal.variation_asins) && (deal.variants?.length > 0 || deal.variation_asins?.length > 0) && (
                  <div className="space-y-2 sm:space-y-3 w-full min-w-0 overflow-hidden bg-zinc-50/50 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-zinc-100/50">
                    <p className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Available Variations</p>
                    <Splide
                      options={{
                        gap: '12px',
                        autoWidth: true,
                        pagination: false,
                        arrows: false,
                        drag: 'free',
                        wheel: false,
                        dragAngleThreshold: 30,
                      }}
                      className="variations-slider w-full cursor-grab active:cursor-grabbing"
                    >
                      {(deal.variants || deal.variation_asins?.map((a: string) => ({ asin: a }))).map((v: any) => (
                        <SplideSlide key={v.asin}>
                          <Link
                            href={`/deal/${v.deal_hash || v.asin}`}
                            className="group block w-20 sm:w-24 bg-white rounded-xl border border-zinc-100 overflow-hidden hover:border-primary transition-all shadow-sm select-none"
                          >
                            <div className="aspect-square bg-white p-2 flex items-center justify-center">
                              <img
                                src={v.image || deal.image || undefined}
                                alt={v.title || v.asin}
                                className="w-full h-full object-contain select-none"
                              />
                            </div>
                            <div className="p-0.5 sm:p-1 border-t border-zinc-50 bg-zinc-50/30">
                              <p className="text-[9px] sm:text-[10px] font-black text-zinc-900 text-center">
                                ${v.discounted_price ? Number(v.discounted_price).toFixed(2) : Number(deal.discounted_price).toFixed(2)}
                              </p>
                            </div>
                          </Link>
                        </SplideSlide>
                      ))}
                    </Splide>
                  </div>
                )}

                {/* Instructions */}
                <div className="flex items-center justify-between p-2.5 sm:p-3 md:p-3.5 bg-zinc-50 border border-zinc-100 rounded-lg sm:rounded-xl cursor-pointer hover:bg-zinc-100 transition-colors">
                  <div className="flex items-center gap-2 sm:gap-2.5 text-xs sm:text-sm font-medium text-zinc-600">
                    <Info size={16} className="sm:w-[18px] sm:h-[18px] text-zinc-400 shrink-0" />
                    <span className="text-[11px] sm:text-sm">Instructions: Apply Promo Code</span>
                  </div>
                  <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px] text-zinc-400 shrink-0" />
                </div>

                {/* Promo Code / CTA — Ticket-style coupon */}
                 {(deal.promo_code || (deal.codes && deal.codes.length > 0) || deal.has_coupon) ? (
                  <div className="space-y-3 sm:space-y-4">
                    {/* Coupon Ticket Card */}
                    <div className="relative hover:shadow-md hover:shadow-primary/5 transition-all duration-300 rounded-2xl overflow-hidden">
                      {/* Scalloped edge cutouts — left and right punched holes */}
                      <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-r-2 border-dashed border-primary/30 z-20" />
                      <div className="absolute right-[-12px] top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-l-2 border-dashed border-primary/30 z-20" />

                      <div className="relative bg-primary/[0.03] rounded-2xl border-2 border-dashed border-primary/20 p-5 sm:p-6 overflow-hidden">
                        <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-6">
                          {/* Left section — Coupon Info & Promo Code */}
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              {/* Badge */}
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">
                                <TicketPercent size={12} className="shrink-0" />
                                Exclusive Promo Code
                              </div>

                              {/* Store name */}
                              <h3 className="text-zinc-800 text-lg font-extrabold uppercase mt-3 flex items-center gap-2">
                                {deal.merchant_name || 'Amazon'}
                                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider normal-case bg-zinc-100 px-2 py-0.5 rounded">
                                  Verified Offer
                                </span>
                              </h3>
                              <p className="text-xs text-zinc-500 font-medium mt-1">
                                Save extra at checkout with this voucher code.
                              </p>
                            </div>

                            {/* Code Copy Box */}
                            <div 
                              onClick={handleCopyAndRedirect}
                              className={`mt-4 p-3.5 bg-white border rounded-xl flex items-center justify-between cursor-pointer shadow-sm hover:shadow active:scale-[0.99] transition-all duration-200
                                ${codeCopied ? 'border-emerald-500 bg-emerald-50/10' : 'border-primary/20 hover:border-primary/40'}
                              `}
                            >
                              <div className="flex flex-col min-w-0">
                                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Voucher Code</span>
                                <span className={`font-mono font-black text-xl sm:text-2xl tracking-[0.1em] uppercase truncate transition-colors duration-200
                                  ${codeCopied ? 'text-emerald-600' : 'text-primary'}
                                `}>
                                  {deal.promo_code || (deal.codes && deal.codes[0]) || (deal.has_coupon && (deal.coupon_value || "COUPON")) || "DEAL"}
                                </span>
                              </div>
                              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                                codeCopied ? 'bg-emerald-500 text-white' : 'bg-primary/10 text-primary hover:bg-primary/20'
                              }`}>
                                {codeCopied ? (
                                  <>
                                    <CheckIcon size={14} />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <CopyIcon size={14} />
                                    <span>Copy Code</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Vertical divider (hidden on mobile, visible on desktop) */}
                          <div className="hidden md:flex flex-col items-center justify-center">
                            <div className="w-px border-l-2 border-dashed border-primary/30 h-full" />
                          </div>

                          {/* Horizontal divider (visible on mobile, hidden on desktop) */}
                          <div className="md:hidden w-full border-t-2 border-dashed border-primary/20 my-2" />

                          {/* Right section — CTA button/Copy feedback */}
                          <div className="w-full md:w-[140px] flex flex-row md:flex-col items-center justify-center md:justify-center gap-3">
                            <button
                              onClick={handleCopyAndRedirect}
                              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                                codeCopied 
                                  ? 'bg-emerald-500 text-white shadow-emerald-200' 
                                  : 'bg-primary text-white hover:scale-105 active:scale-95 shadow-primary/20'
                              }`}
                            >
                              {codeCopied ? <CheckIcon size={24} /> : <CopyIcon size={24} />}
                            </button>
                            <div className="flex flex-col text-left md:text-center">
                              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Voucher Status</span>
                              <span className={`text-xs font-extrabold uppercase tracking-wide ${codeCopied ? 'text-emerald-600' : 'text-primary'}`}>
                                {codeCopied ? 'Ready to Paste' : 'Click to Copy'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Button
                      className="w-full h-12 sm:h-[52px] bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-sm sm:text-base rounded-xl sm:rounded-2xl flex items-center justify-center gap-2.5 hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg shadow-emerald-200/60 hover:shadow-xl active:scale-[0.98]"
                      onPress={() => {
                        const codeToCopy = deal.promo_code || (deal.codes && deal.codes[0])
                        if (codeToCopy) navigator.clipboard.writeText(codeToCopy)
                        const targetUrl = getProductUrl(deal, settings)

                        const activeStore = (deal.merchant_name || 'amazon').toLowerCase()
                        const trackingId = activeStore === 'ebay' ? settings.ebay_affiliate_id :
                                           activeStore === 'walmart' ? settings.walmart_affiliate_id :
                                           (activeStore === 'bestbuy' || activeStore === 'best buy') ? settings.bestbuy_affiliate_id :
                                           (activeStore === 'macys' || activeStore === 'macy\'s') ? settings.macys_affiliate_id :
                                           activeStore === 'newegg' ? settings.newegg_affiliate_id :
                                           activeStore === 'woot' ? settings.woot_affiliate_id :
                                           settings.amazon_affiliate_id || affiliateId;

                        fetch('/api/analytics/affiliate-click', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            asin: deal.asin,
                            title: deal.title,
                            type: 'promo_copy',
                            affiliateId: trackingId,
                            merchantId: deal.merchant_id,
                            page: window.location.pathname
                          }),
                          keepalive: true
                        }).catch(() => {});

                        window.open(targetUrl, '_blank')
                      }}
                    >
                      <ExternalLink size={18} className="sm:w-5 sm:h-5" />
                      {deal.has_coupon && !deal.promo_code && !(deal.codes && deal.codes.length > 0) ? "Apply Coupon & Shop" : "Copy Code & Shop"}
                    </Button>
                  </div>
                ) : (
                    <Button
                      className="w-full h-11 sm:h-12 bg-[#FF9900] text-white font-bold text-sm sm:text-base rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 hover:bg-[#FF8C00] transition-all shadow-lg shadow-orange-200"
                      onPress={() => {
                        const targetUrl = getProductUrl(deal, settings)

                        const activeStore = (deal.merchant_name || 'amazon').toLowerCase()
                        const trackingId = activeStore === 'ebay' ? settings.ebay_affiliate_id :
                                           activeStore === 'walmart' ? settings.walmart_affiliate_id :
                                           (activeStore === 'bestbuy' || activeStore === 'best buy') ? settings.bestbuy_affiliate_id :
                                           (activeStore === 'macys' || activeStore === 'macy\'s') ? settings.macys_affiliate_id :
                                           activeStore === 'newegg' ? settings.newegg_affiliate_id :
                                           activeStore === 'woot' ? settings.woot_affiliate_id :
                                           settings.amazon_affiliate_id || affiliateId;

                        // Log click
                        fetch('/api/analytics/affiliate-click', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            asin: deal.asin,
                            title: deal.title,
                            type: `view_on_${(deal.merchant_name || 'Amazon').toLowerCase()}`,
                            affiliateId: trackingId,
                            merchantId: deal.merchant_id,
                            page: window.location.pathname
                          }),
                          keepalive: true
                        }).catch(() => {});

                        window.open(targetUrl, '_blank')
                      }}
                    >
                    <ShoppingBag size={18} className="sm:w-5 sm:h-5" />
                    View on {deal.merchant_name || 'Amazon'}
                  </Button>
                )}

                {/* Disclaimer */}
                <p className="text-[10px] sm:text-[11px] text-zinc-400 leading-relaxed text-center px-2 sm:px-4">
                  AzonDeal may earn commissions on qualifying purchases. <Link href="/affiliate-disclosure" className="underline hover:text-zinc-600">Read our full affiliate disclosure policy here.</Link>
                </p>
              </div>
            </div>

            {/* Similar Deals */}
            <SimilarDeals title={deal.title} asin={deal.asin} platform={deal.merchant_name?.toLowerCase() === 'ebay' ? 'ebay' : 'amazon'} savedAsins={allSavedAsins} />
          </>
        ) : null}

        {/* Share Modal */}
        {deal && <ShareDrawer isOpen={isOpen} onClose={onClose} deal={deal} />}
      </div>
    </div>
  )
}
