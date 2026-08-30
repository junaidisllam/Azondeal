'use client'

import React, { useState, useEffect, useCallback, Suspense, useRef, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from "@heroui/button"
import { Chip } from "@heroui/chip"
import {
  Dropdown,
  Drawer,
  useOverlayState,
  ListBox,
  Popover,
  Slider
} from "@heroui/react"
import {
  TicketPercent,
  TrendingDown,
  ArrowUpDown,
  SlidersHorizontal,
  Search as SearchIcon,
  LayoutGrid,
  Percent,
  DollarSign,
  CheckCircle,
  X,
  Check,
  ChevronRight,
  Tag,
  Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { DealCard, DealCardSkeleton } from '@/components/DealCard'

// ─── Constants ───────────────────────────────────────────────────────────────

const EXPLORE_CATEGORIES = [
  "Home & Kitchen",
  "Fashion & Clothing",
  "Tech & Electronics",
  "Beauty & Care",
  "Tools",
  "Toys",
  "Garden",
  "Baby",
  "Health",
  "Grocery",
  "Sports",
  "Automotive",
  "Pets",
  "Office"
]

const SORT_OPTIONS = [
  { label: 'Featured', value: 'recommended' },
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low → High', value: 'price_asc' },
  { label: 'Price: High → Low', value: 'price_desc' },
]

const STORES = [
  { label: 'Amazon', value: 'amazon' },
  { label: 'Best Buy', value: 'bestbuy' },
  { label: 'eBay', value: 'ebay' },
  { label: "Macy's", value: 'macys' },
  { label: 'Newegg', value: 'newegg' },
  { label: 'Walmart', value: 'walmart' },
  { label: 'Woot', value: 'woot' }
]

const DISCOUNTS = [
  { label: '0 - 30%', value: '1' },
  { label: '30% - 60%', value: '2' },
  { label: 'Over 60%', value: '3' }
]

const DEFAULT_FILTERS = {
  category: '',
  discounts: [] as string[],
  priceRange: [0, 1000] as [number, number],
  sortBy: 'recommended',
  hasPromoCode: false,
  hasPriceDrop: false,
  plts: [] as string[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatPrice = (price: any) => {
  if (price === undefined || price === null) return '0'
  const num = Number(price)
  return isNaN(num) ? String(price) : num.toFixed(2).replace(/\.?0+$/, '')
}

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    const mq = window.matchMedia('(max-width: 767px)')
    mq.addEventListener('change', (e) => setIsMobile(e.matches))
    return () => mq.removeEventListener('change', (e) => setIsMobile(e.matches))
  }, [])
  return isMobile
}

// ─── Active Filter Chips ──────────────────────────────────────────────────────

const ActiveFilters = React.memo(({ filters, onRemove, onRemoveStore, onRemoveDiscount }: {
  filters: typeof DEFAULT_FILTERS,
  onRemove: (key: string) => void,
  onRemoveStore: (store: string) => void,
  onRemoveDiscount: (disc: string) => void
}) => {
  const chips = useMemo(() => {
    const list: { key: string; label: string; extra?: string }[] = []
    if (filters.category) list.push({ key: 'category', label: filters.category })
    
    filters.discounts.forEach(d => {
      const label = d === '1' ? '0 - 30% Off' : d === '2' ? '30% - 60% Off' : d === '3' ? 'Over 60% Off' : d
      list.push({ key: 'discount', label, extra: d })
    })

    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) {
      list.push({ key: 'priceRange', label: `$${filters.priceRange[0]}–$${filters.priceRange[1] === 1000 ? '999+' : filters.priceRange[1]}` })
    }
    if (filters.hasPromoCode) list.push({ key: 'hasPromoCode', label: 'Promo Codes' })
    if (filters.hasPriceDrop) list.push({ key: 'hasPriceDrop', label: 'Verified Low' })
    
    filters.plts.forEach(p => {
      const storeLabel = p === 'amazon' ? 'Amazon' : p === 'walmart' ? 'Walmart' : p === 'ebay' ? 'eBay' : p === 'bestbuy' ? 'Best Buy' : p === 'macys' ? "Macy's" : p === 'newegg' ? 'Newegg' : p === 'woot' ? 'Woot' : p
      list.push({ key: 'plt', label: storeLabel, extra: p })
    })

    if (filters.sortBy !== 'recommended') {
      const opt = SORT_OPTIONS.find(o => o.value === filters.sortBy)
      if (opt) list.push({ key: 'sortBy', label: opt.label })
    }
    return list
  }, [filters])

  if (!chips.length) return null

  return (
    <div className="flex items-center gap-2 flex-wrap mt-3">
      {chips.map((chip, i) => (
        <motion.span
          key={chip.key + (chip.extra || '') + i}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold"
        >
          {chip.label}
          <button
            onClick={() => {
              if (chip.key === 'plt' && chip.extra) onRemoveStore(chip.extra)
              else if (chip.key === 'discount' && chip.extra) onRemoveDiscount(chip.extra)
              else onRemove(chip.key)
            }}
            className="hover:bg-orange-100 rounded-full p-0.5 transition-colors"
          >
            <X size={10} />
          </button>
        </motion.span>
      ))}
    </div>
  )
})

// ─── Category Selector ────────────────────────────────────────────────────────

const CategorySelector = React.memo(({ currentCategory, onSelect }: {
  currentCategory: string
  onSelect: (category: string) => void
}) => {
  const drawerState = useOverlayState({ defaultOpen: false })
  const isMobile = useIsMobile()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return (
    <div className="h-10 px-4 rounded-lg bg-white border border-zinc-200 flex items-center gap-2 text-zinc-600 text-sm font-medium min-w-max">
      <LayoutGrid size={16} className="text-primary" />
      Categories
    </div>
  )

  if (isMobile) return (
    <>
      <button
        onClick={() => drawerState.open()}
        className={`h-10 px-4 rounded-xl flex items-center gap-2 font-semibold text-sm transition-all min-w-max ${
          currentCategory ? 'bg-primary text-white' : 'bg-white border border-zinc-200 text-zinc-600'
        }`}
      >
        <LayoutGrid size={15} className={currentCategory ? 'text-white' : 'text-primary'} />
        <span className="max-w-[100px] truncate">{currentCategory || 'Categories'}</span>
      </button>

      <Drawer state={drawerState}>
        <Drawer.Backdrop variant="opaque" className="z-[200]">
          <Drawer.Content placement="bottom" className="z-[200]">
            <Drawer.Dialog className="bg-white rounded-t-3xl max-h-[75vh]">
              <Drawer.Handle />
              <Drawer.Header className="px-5 pb-2 pt-1">
                <Drawer.Heading className="text-lg font-bold">Categories</Drawer.Heading>
              </Drawer.Header>
              <Drawer.Body className="pb-8 overflow-y-auto">
                <ListBox
                  onAction={(key) => {
                    onSelect(key === 'all' ? '' : String(key))
                    drawerState.close()
                  }}
                  className="p-0"
                >
                  <ListBox.Item id="all" textValue="All Categories"
                    className={`py-3 px-4 rounded-xl mb-1 ${!currentCategory ? 'bg-orange-50' : ''}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <LayoutGrid size={18} className={!currentCategory ? 'text-primary' : 'text-zinc-400'} />
                        <span className={`font-semibold ${!currentCategory ? 'text-primary' : 'text-zinc-700'}`}>All Categories</span>
                      </div>
                      {!currentCategory && <Check size={16} className="text-primary" />}
                    </div>
                  </ListBox.Item>
                  {EXPLORE_CATEGORIES.map(cat => (
                    <ListBox.Item key={cat} id={cat} textValue={cat}
                      className={`py-3 px-4 rounded-xl mb-0.5 ${currentCategory === cat ? 'bg-orange-50' : ''}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`font-medium ${currentCategory === cat ? 'text-primary font-semibold' : 'text-zinc-700'}`}>{cat}</span>
                        {currentCategory === cat && <Check size={16} className="text-primary" />}
                      </div>
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Drawer.Body>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>
    </>
  )

  return (
    <Dropdown>
      <Dropdown.Trigger className={`h-10 px-4 !rounded-xl cursor-pointer flex items-center gap-2 transition-all outline-none text-sm font-semibold min-w-max ${
        currentCategory ? 'bg-primary text-white' : 'text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50'
      }`}>
        <LayoutGrid size={15} className={currentCategory ? 'text-white' : 'text-primary'} />
        <span className="whitespace-nowrap max-w-[140px] truncate">{currentCategory || 'Categories'}</span>
      </Dropdown.Trigger>
      <Dropdown.Popover className="min-w-[220px] p-1 bg-white border border-zinc-100 shadow-xl rounded-xl">
        <Dropdown.Menu
          onAction={(key) => onSelect(key === 'all' ? '' : String(key))}
          className="p-1 max-h-[350px] overflow-y-auto no-scrollbar"
        >
          <Dropdown.Item id="all" textValue="All"
            className={`py-2 px-3 rounded-lg mb-0.5 ${!currentCategory ? 'bg-orange-50 text-primary' : 'hover:bg-zinc-50'}`}
          >
            <div className="flex items-center gap-2">
              <LayoutGrid size={15} className={!currentCategory ? 'text-primary' : 'text-zinc-400'} />
              <span className="font-medium">All Categories</span>
            </div>
          </Dropdown.Item>
          {EXPLORE_CATEGORIES.map(cat => (
            <Dropdown.Item key={cat} id={cat} textValue={cat}
              className={`py-2 px-3 rounded-lg mb-0.5 ${currentCategory === cat ? 'bg-orange-50' : 'hover:bg-zinc-50'}`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`font-medium ${currentCategory === cat ? 'text-primary' : 'text-zinc-700'}`}>{cat}</span>
                {currentCategory === cat && <CheckCircle size={13} className="text-primary" />}
              </div>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
})

const FilterBody = ({
  local,
  update,
  activeCount,
  isMobile,
  dynamicMaxPrice,
  onReset,
  onApply,
  onClose,
}: {
  local: typeof DEFAULT_FILTERS
  update: (patch: Partial<typeof DEFAULT_FILTERS>) => void
  activeCount: number
  isMobile: boolean
  dynamicMaxPrice: number
  onReset: () => void
  onApply: () => void
  onClose: () => void
}) => (
  <Drawer.Dialog className={`bg-white flex flex-col ${isMobile ? 'rounded-t-3xl h-auto max-h-full' : 'h-full'}`}>
    {isMobile && <Drawer.Handle />}

    {/* Header */}
    <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 shrink-0">
      <div>
        <h2 className="text-lg font-bold text-zinc-900">Filters & Sort</h2>
        {activeCount > 0 && (
          <p className="text-xs text-primary font-medium mt-0.5">{activeCount} active</p>
        )}
      </div>
      <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
        <X size={18} className="text-zinc-500" />
      </button>
    </div>

    {/* Body */}
    <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7 no-scrollbar">
      {/* Sort */}
      <section>
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Sort By</p>
        <div className="grid grid-cols-2 gap-2">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => update({ sortBy: opt.value })}
              className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-all text-left ${
                local.sortBy === opt.value
                  ? 'bg-primary text-white shadow-md shadow-orange-200'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section>
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Category</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => update({ category: '' })}
            className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${
              local.category === '' ? 'bg-primary text-white shadow-md shadow-orange-200' : 'bg-zinc-100 text-zinc-600'
            }`}
          >
            All
          </button>
          {EXPLORE_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => update({ category: cat })}
              className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                local.category === cat ? 'bg-primary text-white shadow-md shadow-orange-200' : 'bg-zinc-100 text-zinc-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Store / Platform */}
      <section>
        <p className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-3">Store</p>
        <div className="space-y-3.5 pl-1">
          {STORES.map(store => {
            const isChecked = local.plts.includes(store.value)
            return (
              <label key={store.value} className="flex items-center gap-3 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    const nextPlts = isChecked
                      ? local.plts.filter(x => x !== store.value)
                      : [...local.plts, store.value]
                    update({ plts: nextPlts })
                  }}
                  className="rounded border-zinc-300 text-primary focus:ring-primary size-5 cursor-pointer accent-[#EF4444]"
                />
                <span className="text-sm font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">
                  {store.label}
                </span>
              </label>
            )
          })}
        </div>
      </section>

      {/* Discount */}
      <section>
        <p className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-3">Discount</p>
        <div className="space-y-3.5 pl-1">
          {DISCOUNTS.map(disc => {
            const isChecked = local.discounts.includes(disc.value)
            return (
              <label key={disc.value} className="flex items-center gap-3 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    const nextDiscs = isChecked
                      ? local.discounts.filter(x => x !== disc.value)
                      : [...local.discounts, disc.value]
                    update({ discounts: nextDiscs })
                  }}
                  className="rounded border-zinc-300 text-primary focus:ring-primary size-5 cursor-pointer accent-[#EF4444]"
                />
                <span className="text-sm font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">
                  {disc.label}
                </span>
              </label>
            )
          })}
        </div>
      </section>

      {/* Price Range */}
      <section>
        <p className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-3">Price Range</p>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">Min Price</label>
            <input
              type="number"
              placeholder="0"
              value={local.priceRange[0]}
              onChange={(e) => {
                const val = Number(e.target.value) || 0
                update({ priceRange: [val, local.priceRange[1]] })
              }}
              className="w-full bg-transparent border-b-2 border-zinc-200 focus:border-primary outline-none py-1.5 text-sm font-bold text-zinc-800 placeholder:text-zinc-300"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">Max Price</label>
            <input
              type="number"
              placeholder={String(dynamicMaxPrice)}
              value={local.priceRange[1] === 1000 ? '' : local.priceRange[1]}
              onChange={(e) => {
                const val = e.target.value === '' ? 1000 : (Number(e.target.value) || dynamicMaxPrice)
                update({ priceRange: [local.priceRange[0], val] })
              }}
              className="w-full bg-transparent border-b-2 border-zinc-200 focus:border-primary outline-none py-1.5 text-sm font-bold text-zinc-800 placeholder:text-zinc-300"
            />
          </div>
        </div>
      </section>

      {/* Preferences */}
      <section>
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Preferences</p>
        <div className="space-y-2.5">
          {[
            { key: 'hasPromoCode' as const, icon: TicketPercent, label: 'Promo Codes Only', sub: 'Deals with coupon codes' },
            { key: 'hasPriceDrop' as const, icon: TrendingDown, label: 'Verified Low Price', sub: 'Confirmed price drops' },
          ].map(({ key, icon: Icon, label, sub }) => (
            <button
              key={key}
              onClick={() => update({ [key]: !local[key] })}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                local[key] ? 'border-primary bg-orange-50' : 'border-zinc-100 bg-zinc-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${local[key] ? 'bg-orange-100' : 'bg-white'}`}>
                  <Icon size={18} className={local[key] ? 'text-primary' : 'text-zinc-400'} />
                </div>
                <div className="text-left">
                  <p className={`font-semibold text-sm ${local[key] ? 'text-primary' : 'text-zinc-700'}`}>{label}</p>
                  <p className="text-xs text-zinc-400">{sub}</p>
                </div>
              </div>
              <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                local[key] ? 'border-primary bg-primary' : 'border-zinc-300'
              }`}>
                {local[key] && <Check size={13} className="text-white" />}
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>

    {/* Footer */}
    <div className="shrink-0 border-t border-zinc-100 px-5 py-4 flex gap-3 bg-white">
      <Button
        variant="bordered"
        className="flex-1 font-bold h-12 rounded-xl border-zinc-200"
        onPress={onReset}
      >
        Reset All
      </Button>
      <Button
        className="flex-[2] bg-primary text-white font-bold h-12 rounded-xl shadow-lg shadow-orange-200"
        onPress={onApply}
      >
        Show Results {activeCount > 0 && `(${activeCount})`}
      </Button>
    </div>
  </Drawer.Dialog>
)

// ─── Full Filter Drawer — mobile=bottom, desktop=left (separate to avoid hydration bug) ──

const FilterDrawer = React.memo(({ isOpen, onOpenChange, filters, dynamicMaxPrice, onFilterChange, onReset }: {
  isOpen: boolean
  onOpenChange: (v: boolean) => void
  filters: typeof DEFAULT_FILTERS
  dynamicMaxPrice: number
  onFilterChange: (f: Partial<typeof DEFAULT_FILTERS>) => void
  onReset: () => void
}) => {
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [local, setLocal] = useState(filters)

  useEffect(() => {
    setMounted(true)
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    const mq = window.matchMedia('(max-width: 767px)')
    mq.addEventListener('change', e => setIsMobile(e.matches))
    return () => mq.removeEventListener('change', e => setIsMobile(e.matches))
  }, [])

  useEffect(() => { if (isOpen) setLocal(filters) }, [isOpen])

  const update = useCallback((patch: Partial<typeof DEFAULT_FILTERS>) => {
    setLocal(prev => ({ ...prev, ...patch }))
  }, [])

  const activeCount = useMemo(() => {
    let n = 0
    if (local.category) n++
    if (local.discounts.length > 0) n += local.discounts.length
    if (local.priceRange[0] > 0 || local.priceRange[1] < 1000) n++
    if (local.hasPromoCode) n++
    if (local.hasPriceDrop) n++
    if (local.plts.length > 0) n += local.plts.length
    if (local.sortBy !== 'recommended') n++
    return n
  }, [local])

  const handleApply = useCallback(() => {
    onFilterChange(local)
    onOpenChange(false)
  }, [local, onFilterChange, onOpenChange])

  const handleReset = useCallback(() => {
    setLocal(DEFAULT_FILTERS)
    onReset()
  }, [onReset])

  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange])

  const bodyProps = { local, update, activeCount, isMobile, dynamicMaxPrice, onReset: handleReset, onApply: handleApply, onClose: handleClose }

  // Don't render until mounted — avoids hydration placement mismatch
  if (!mounted) return null

  if (isMobile) {
    return (
      <Drawer>
        <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} variant="blur" className="z-[200]">
          {/* placement="bottom" hardcoded for mobile — no conditional */}
          <Drawer.Content placement="bottom" className="z-[200] h-auto max-h-[85vh] mt-auto">
            <FilterBody {...bodyProps} />
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>
    )
  }

  return (
    <Drawer>
      <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} variant="blur" className="z-[200]">
        {/* placement="left" hardcoded for desktop — no conditional */}
        <Drawer.Content placement="left" className="z-[200] w-[360px]">
          <FilterBody {...bodyProps} />
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  )
})

// ─── Main Search Page ─────────────────────────────────────────────────────────

function SearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('query') || ''

  const [deals, setDeals] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const initialFilters = useMemo(() => {
    const cat = searchParams.get('category') || ''
    
    const discountsArr = searchParams.getAll('discount[]').length > 0
      ? searchParams.getAll('discount[]')
      : (searchParams.get('discount') ? [searchParams.get('discount') as string] : [])

    const minPrice = Number(searchParams.get('minPrice') || '0')
    const maxPrice = Number(searchParams.get('maxPrice') || '1000')
    const sort = searchParams.get('sortBy') || 'recommended'
    const promo = searchParams.get('hasPromoCode') === 'true'
    const drop = searchParams.get('hasPriceDrop') === 'true'

    const pltsArr = searchParams.getAll('plt[]').length > 0
      ? searchParams.getAll('plt[]')
      : (searchParams.get('plt') ? [searchParams.get('plt') as string] : [])

    return {
      category: cat,
      discounts: discountsArr,
      priceRange: [minPrice, maxPrice] as [number, number],
      sortBy: sort,
      hasPromoCode: promo,
      hasPriceDrop: drop,
      plts: pltsArr
    }
  }, [searchParams])

  const [filters, setFilters] = useState(initialFilters)

  useEffect(() => {
    if (query) {
      document.title = `Search results for "${query}" - Azon Deal`
    } else {
      document.title = "Search Deals - Azon Deal"
    }
  }, [query])

  const [dynamicMaxPrice, setDynamicMaxPrice] = useState(1000)

  useEffect(() => {
    if (!query) return
    const p = new URLSearchParams()
    p.append('query', query)
    if (filters.plts.length > 0) {
      filters.plts.forEach(store => p.append('plt[]', store))
    }
    fetch(`/api/search/price?${p.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.max && typeof data.max === 'number') {
          setDynamicMaxPrice(Math.ceil(data.max))
        }
      })
      .catch(err => console.error('[Search Page] Error fetching price range:', err))
  }, [query, filters.plts])

  useEffect(() => {
    setFilters(initialFilters)
  }, [initialFilters])

  const updateUrl = useCallback((newFilters: typeof DEFAULT_FILTERS) => {
    const params = new URLSearchParams()
    if (query) params.set('query', query)
    if (newFilters.category) params.set('category', newFilters.category)
    
    if (newFilters.discounts.length > 0) {
      newFilters.discounts.forEach(d => params.append('discount[]', d))
    }

    if (newFilters.sortBy !== 'recommended') params.set('sortBy', newFilters.sortBy)
    if (newFilters.hasPromoCode) params.set('hasPromoCode', 'true')
    if (newFilters.hasPriceDrop) params.set('hasPriceDrop', 'true')
    
    if (newFilters.priceRange[0] > 0) params.set('minPrice', newFilters.priceRange[0].toString())
    if (newFilters.priceRange[1] < 1000) params.set('maxPrice', newFilters.priceRange[1].toString())
    
    if (newFilters.plts.length > 0) {
      newFilters.plts.forEach(p => params.append('plt[]', p))
    }

    router.replace(`/search?${params.toString()}`, { scroll: false })
  }, [query, router])

  const [localQuery, setLocalQuery] = useState(query)
  const [suggestions, setSuggestions] = useState<any>(null)
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)

  const searchRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setLocalQuery(query) }, [query])

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setIsSuggestionsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Suggestions
  useEffect(() => {
    if (localQuery.trim().length < 2) { setSuggestions(null); return }
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/search_suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: localQuery }),
        })
        if (res.ok) setSuggestions(await res.json())
      } catch { /* silent */ }
    }, 300)
    return () => clearTimeout(t)
  }, [localQuery])

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current) return
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) fetchDeals(true) },
      { threshold: 0.5 }
    )
    obs.observe(loadMoreRef.current)
    return () => obs.disconnect()
  }, [hasMore, isLoadingMore, isLoading, deals])

  const buildSearchUrl = useCallback((pageNum: number, f: typeof DEFAULT_FILTERS) => {
    const p = new URLSearchParams()
    p.append('query', query)
    p.append('page', pageNum.toString())
    p.append('limit', '24')
    if (f.category) p.append('category', f.category)
    
    if (f.discounts.length > 0) {
      f.discounts.forEach(d => p.append('discount[]', d))
    }

    if (f.sortBy !== 'recommended') p.append('sortBy', f.sortBy)
    if (f.hasPromoCode) p.append('hasPromoCode', 'true')
    if (f.hasPriceDrop) p.append('hasPriceDrop', 'true')
    
    if (f.priceRange[0] > 0) p.append('minPrice', f.priceRange[0].toString())
    if (f.priceRange[1] < 1000) p.append('maxPrice', f.priceRange[1].toString())
    
    if (f.plts.length > 0) {
      f.plts.forEach(store => p.append('plt[]', store))
    }
    return `/api/search?${p.toString()}`
  }, [query])

  const fetchDeals = useCallback(async (isLoadMore = false) => {
    if (!query) return
    if (isLoadMore) setIsLoadingMore(true)
    else { setIsLoading(true); setHasMore(true) }

    try {
      const currentPage = isLoadMore ? page + 1 : 1
      const response = await fetch(buildSearchUrl(currentPage, filters))
      const data = await response.json()
      const results = data.deals || []

      const formatted = results.map((item: any, index: number) => ({
        asin: item.asin || index.toString(),
        id: item.asin || index.toString(),
        hash: item.deal_hash,
        title: item.title,
        image: item.image,
        discount: item.discount_percentage ? `${Math.round(item.discount_percentage)}% OFF` : 'Deal',
        price: `$${formatPrice(item.discounted_price)}`,
        originalPrice: `$${formatPrice(item.list_price)}`,
        store: item.merchant_name || 'Amazon',
        promo_code: item.promo_code,
        hasPromo: !!item.promo_code,
        rating: item.rating,
        reviews: item.ratings_count,
        sold: item.bought_past_month > 0 ? `${item.bought_past_month}+ Sold` : undefined,
        rank: item.rank
      }))

      const dedup = (arr: any[]) => arr.filter((d, i, s) => i === s.findIndex(x => x.id === d.id))

      if (isLoadMore) {
        setDeals(prev => dedup([...prev, ...formatted]))
        setPage(currentPage)
      } else {
        setDeals(dedup(formatted))
        setPage(1)
      }

      setHasMore(data.hasNextPage ?? (results.length >= 24))
    } catch (error) {
      console.error('Search error:', error)
      setHasMore(false)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [query, filters, page, buildSearchUrl])

  useEffect(() => {
    fetchDeals()
  }, [query, filters])

  const handleSearchSubmit = useCallback((q: string) => {
    const sq = q.trim()
    if (!sq) return
    setIsSuggestionsOpen(false)
    fetch('/api/search/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sq, page: '/search' }),
      keepalive: true,
    }).catch(() => {})
    const params = new URLSearchParams(searchParams.toString())
    params.set('query', sq)
    params.set('page', '1')
    window.location.href = `/search?${params.toString()}`
  }, [searchParams])

  const handleRemoveFilter = useCallback((key: string) => {
    const next = { ...filters }
    if (key === 'category') next.category = ''
    else if (key === 'priceRange') next.priceRange = [0, 1000]
    else if (key === 'hasPromoCode') next.hasPromoCode = false
    else if (key === 'hasPriceDrop') next.hasPriceDrop = false
    else if (key === 'sortBy') next.sortBy = 'recommended'
    
    setFilters(next)
    updateUrl(next)
  }, [filters, updateUrl])

  const handleRemoveStore = useCallback((store: string) => {
    const next = {
      ...filters,
      plts: filters.plts.filter(x => x !== store)
    }
    setFilters(next)
    updateUrl(next)
  }, [filters, updateUrl])

  const handleRemoveDiscount = useCallback((disc: string) => {
    const next = {
      ...filters,
      discounts: filters.discounts.filter(x => x !== disc)
    }
    setFilters(next)
    updateUrl(next)
  }, [filters, updateUrl])

  const activeFilterCount = useMemo(() => {
    let n = 0
    if (filters.category) n++
    if (filters.discounts.length > 0) n += filters.discounts.length
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) n++
    if (filters.hasPromoCode) n++
    if (filters.hasPriceDrop) n++
    if (filters.plts.length > 0) n += filters.plts.length
    if (filters.sortBy !== 'recommended') n++
    return n
  }, [filters])

  return (
    <div className="max-w-[1280px] mx-auto px-3 sm:px-4 py-5 sm:py-8">

      {/* Breadcrumb + Title */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] mb-1.5">
          <span>Search</span>
          <ChevronRight size={10} />
          <span className="text-zinc-700 font-medium truncate max-w-[200px]">{query}</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 truncate">
          Results for <span className="text-primary">"{query}"</span>
        </h1>
      </div>

      {/* Sticky Search + Filter Bar */}
      <div className="sticky top-16 sm:top-20 z-40 bg-white/90 sm:bg-zinc-50/90 backdrop-blur-md py-3 mb-5 border-b border-zinc-100 sm:border-none -mx-3 sm:mx-0 px-3 sm:px-0">
        <div className="flex gap-2 items-center w-full" ref={searchRef}>
          {/* Search Box */}
          <div className="relative flex-1 group">
            <div className="relative flex items-center bg-white border border-zinc-200 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
              <SearchIcon size={16} className="text-zinc-400 shrink-0" />
              <input
                type="text"
                value={localQuery}
                onChange={(e) => { setLocalQuery(e.target.value); setIsSuggestionsOpen(true) }}
                onFocus={() => setIsSuggestionsOpen(true)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(localQuery)}
                placeholder="Search deals..."
                className="w-full bg-transparent border-none focus:ring-0 outline-none px-2 sm:px-3 text-sm text-zinc-900 placeholder:text-zinc-400 font-medium"
              />
              <AnimatePresence>
                {localQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => { setLocalQuery(''); setSuggestions(null) }}
                    className="p-1 hover:bg-zinc-100 rounded-full transition-colors"
                  >
                    <X size={13} className="text-zinc-400" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Suggestions */}
            <AnimatePresence>
              {isSuggestionsOpen && suggestions?.suggestions?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute top-full left-0 w-full mt-1.5 bg-white rounded-xl shadow-2xl border border-zinc-100 overflow-hidden z-50"
                >
                  <div className="p-1.5">
                    {suggestions.suggestions.map((s: string, idx: number) => (
                      <button
                        key={idx}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-zinc-50 rounded-lg transition-colors text-left"
                        onClick={() => handleSearchSubmit(s)}
                      >
                        <SearchIcon size={13} className="text-zinc-400 shrink-0" />
                        <span className="text-sm text-zinc-700 font-medium">{s}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className={`relative h-10 sm:h-11 px-3 sm:px-5 rounded-xl flex items-center gap-2 font-semibold text-sm transition-all shrink-0 ${
              activeFilterCount > 0
                ? 'bg-primary text-white shadow-md shadow-orange-200'
                : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <SlidersHorizontal size={16} className={activeFilterCount > 0 ? 'text-white' : 'text-primary'} />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-white text-primary text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ml-0.5">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Active filter chips */}
        <AnimatePresence>
          {activeFilterCount > 0 && (
            <ActiveFilters
              filters={filters}
              onRemove={handleRemoveFilter}
              onRemoveStore={handleRemoveStore}
              onRemoveDiscount={handleRemoveDiscount}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onOpenChange={setIsFilterDrawerOpen}
        filters={filters}
        dynamicMaxPrice={dynamicMaxPrice}
        onFilterChange={(newFilters) => {
          const next = { ...filters, ...newFilters }
          setFilters(next)
          updateUrl(next)
        }}
        onReset={() => {
          setFilters(DEFAULT_FILTERS)
          updateUrl(DEFAULT_FILTERS)
        }}
      />

      {/* Results */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
            {Array.from({ length: 10 }).map((_, i) => <DealCardSkeleton key={i} />)}
          </div>
        ) : deals.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4 transform-gpu">
              {deals.map((deal, i) => (
                <motion.div
                  key={deal.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                  className="transform-gpu"
                >
                  <DealCard deal={deal} />
                </motion.div>
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={loadMoreRef} className="flex justify-center mt-10">
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Loading more...
                </div>
              )}
              {!hasMore && deals.length > 0 && (
                <p className="text-sm text-zinc-400 py-4">You've seen all results</p>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-zinc-200">
            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
              <SearchIcon size={28} className="text-zinc-300" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900">No deals found</h3>
            <p className="text-zinc-400 text-sm mt-1 text-center px-6">
              Try adjusting your filters or search term
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  setFilters(DEFAULT_FILTERS)
                  updateUrl(DEFAULT_FILTERS)
                }}
                className="mt-5 px-6 py-2.5 rounded-full bg-orange-50 text-primary font-semibold text-sm hover:bg-orange-100 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-[#F9FAFB]">
      <Suspense fallback={
        <div className="max-w-[1280px] mx-auto px-4 py-8">
          <div className="h-6 w-32 bg-zinc-200 rounded-lg animate-pulse mb-2" />
          <div className="h-8 w-64 bg-zinc-200 rounded-xl animate-pulse mb-10" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => <DealCardSkeleton key={i} />)}
          </div>
        </div>
      }>
        <SearchResults />
      </Suspense>
    </main>
  )
}
