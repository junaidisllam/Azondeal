'use client'

import React, { useRef, useEffect, useState, useCallback, memo } from 'react'
import { createPortal } from 'react-dom'
import {
  Navbar as HeroNavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from "@heroui/navbar"
import Link from "next/link"
import Image from "next/image"
import { Button, SearchField } from "@heroui/react"
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown"
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Trophy, LayoutGrid, CheckCircle2, Info,
  ChevronDown, Search, Clock, X, ArrowLeft,
  TrendingDown, TicketPercent, Settings, Heart, LogOut,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthModal } from '@/context/AuthModalContext'
import { usePathname } from 'next/navigation'

// ─── Static data outside component — never recreated on render ────────────────
const NAV_LINKS = [
  { label: "Top Deals",  icon: <Trophy      size={18} className="text-orange-500" />, href: "/top-deals"  },
  { label: "Category",  icon: <LayoutGrid   size={18} className="text-blue-500"   />, href: "/categories" },
  { label: "Brands",    icon: <CheckCircle2 size={18} className="text-green-500"  />, href: "/brands"     },
  { label: "Explore",   icon: <LayoutGrid   size={18} className="text-purple-500" />, href: "/explore"    },
  { label: "About",     icon: <Info         size={18} className="text-amber-500"  />, href: "/about"      },
] as const

const TRENDING_SEARCHES = ["phone case", "flashlight", "jacket", "sports bra", "blender", "camping tent", "picture frames", "laptop stand"]

// Slide animation — defined once, never recreated
const SLIDE_VARIANTS = {
  hidden: { x: '100%' },
  visible: { x: 0 },
} as const
const SLIDE_TRANSITION = { duration: 0.25, ease: [0.16, 1, 0.3, 1] } as const

// ─── SearchSuggestions (memoized) ─────────────────────────────────────────────
// Extracted so parent re-renders don't repaint the whole dropdown.
interface SuggestionsProps {
  query: string
  apiSuggestions: any
  isLoading: boolean
  recentSearches: string[]
  trendingSearches: readonly string[]
  onSubmit: (q: string) => void
  onRemove: (q: string) => void
}

const SearchSuggestions = memo(function SearchSuggestions({
  query, apiSuggestions, isLoading, recentSearches, trendingSearches, onSubmit, onRemove,
}: SuggestionsProps) {
  const hasQuery = query.trim() !== ''

  return (
    <div className="p-6 space-y-6">
      {hasQuery ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider">Suggestions</h4>
            {isLoading && <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
          </div>
          <div className="space-y-1">
            {apiSuggestions?.suggestions?.length > 0 ? (
              apiSuggestions.suggestions.map((s: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 rounded-xl cursor-pointer transition-colors group"
                  onClick={() => onSubmit(s)}
                >
                  <Search size={16} className="text-zinc-400 group-hover:text-primary transition-colors" />
                  <span className="text-[14px] text-zinc-700 font-medium group-hover:text-zinc-900">{s}</span>
                </div>
              ))
            ) : !isLoading && (
              <div className="text-center py-4">
                <span className="text-zinc-400 text-sm italic">No matching deals found for "{query}"</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {recentSearches.length > 0 && (
            <div>
              <h4 className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider mb-3 px-1">Recent</h4>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((s) => (
                  <div
                    key={s}
                    onClick={() => onSubmit(s)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 rounded-full text-[13px] font-medium cursor-pointer transition-colors group"
                  >
                    <Clock size={12} className="text-zinc-400" />
                    <span>{s}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemove(s) }}
                      className="text-zinc-300 hover:text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <h4 className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider mb-3 px-1">Trending</h4>
            <div className="flex flex-wrap gap-2">
              {trendingSearches.map((s) => (
                <div
                  key={s}
                  onClick={() => onSubmit(s)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 rounded-full text-[13px] font-medium cursor-pointer transition-colors"
                >
                  <Search size={12} className="text-zinc-400" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
})

// Mobile version — same data but bigger touch targets
const MobileSearchSuggestions = memo(function MobileSearchSuggestions({
  query, apiSuggestions, isLoading, recentSearches, trendingSearches, onSubmit, onRemove,
}: SuggestionsProps) {
  const hasQuery = query.trim() !== ''

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-300">
      {hasQuery ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider">Suggestions</h4>
            {isLoading && <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
          </div>
          <div className="space-y-1">
            {apiSuggestions?.suggestions?.length > 0 ? (
              apiSuggestions.suggestions.map((s: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 px-3 py-4 active:bg-zinc-100 rounded-2xl cursor-pointer transition-colors"
                  onClick={() => onSubmit(s)}
                >
                  <Search size={18} className="text-zinc-400" />
                  <span className="text-[16px] text-zinc-700 font-medium">{s}</span>
                </div>
              ))
            ) : !isLoading && (
              <div className="text-center py-10">
                <span className="text-zinc-400 text-sm italic">Searching for "{query}"...</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {recentSearches.length > 0 && (
            <div>
              <h4 className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider mb-4 px-1">Recent Searches</h4>
              <div className="flex flex-wrap gap-2.5">
                {recentSearches.map((s) => (
                  <div
                    key={s}
                    onClick={() => onSubmit(s)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-zinc-50 active:bg-zinc-100 text-zinc-600 rounded-full text-[14px] font-semibold border border-zinc-100 cursor-pointer"
                  >
                    <Clock size={14} className="text-zinc-400" />
                    <span>{s}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemove(s) }}
                      className="p-1 text-zinc-300 active:text-zinc-500 hover:text-zinc-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <h4 className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider mb-4 px-1">Trending Now</h4>
            <div className="grid grid-cols-1 gap-1">
              {trendingSearches.slice(0, 6).map((s) => (
                <button
                  key={s}
                  onClick={() => onSubmit(s)}
                  className="flex items-center gap-4 px-4 py-3.5 active:bg-zinc-50 rounded-2xl text-left"
                >
                  <TrendingDown size={18} className="text-orange-500 shrink-0" />
                  <span className="text-[15px] text-zinc-700 font-bold">{s}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
})

// ─── MobileSearchOverlay (separate component = isolated render tree) ──────────
interface MobileOverlayProps {
  isOpen: boolean
  query: string
  apiSuggestions: any
  isLoading: boolean
  recentSearches: string[]
  onClose: () => void
  onQueryChange: (q: string) => void
  onSubmit: (q: string) => void
  onRemoveRecent: (q: string) => void
}

const MobileSearchOverlay = memo(function MobileSearchOverlay({
  isOpen, query, apiSuggestions, isLoading, recentSearches, onClose, onQueryChange, onSubmit, onRemoveRecent,
}: MobileOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  // Track whether the enter animation is done before rendering suggestions.
  // This avoids painting a large list during the slide animation → no FPS drop.
  const [animDone, setAnimDone] = useState(false)

  useEffect(() => {
    if (!isOpen) { setAnimDone(false); return }
    document.body.style.overflow = 'hidden'
    // Focus after animation starts (100ms) — same as before
    const t = setTimeout(() => inputRef.current?.focus(), 100)
    return () => {
      document.body.style.overflow = ''
      clearTimeout(t)
    }
  }, [isOpen])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'Enter') onSubmit(query)
  }, [query, onClose, onSubmit])

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="mob-search"
          variants={SLIDE_VARIANTS}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={SLIDE_TRANSITION}
          onAnimationComplete={() => setAnimDone(true)}
          // transform-gpu promoted via Framer — no need for willChange style
          className="fixed inset-0 z-[10000] bg-white flex flex-col"
          style={{ contain: 'strict' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 bg-white shrink-0">
            <button
              onClick={onClose}
              className="p-2 active:bg-zinc-100 rounded-full transition-colors shrink-0"
            >
              <ArrowLeft size={22} className="text-zinc-600" />
            </button>
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search deals..."
                className="w-full h-11 pl-11 pr-4 bg-zinc-100/50 rounded-full text-[16px] outline-none border border-transparent focus:border-primary focus:bg-white transition-all"
              />
              <Search size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              {query && (
                <button
                  onClick={() => onQueryChange('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Suggestions — only mounted after animation completes */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {animDone && (
              <MobileSearchSuggestions
                query={query}
                apiSuggestions={apiSuggestions}
                isLoading={isLoading}
                recentSearches={recentSearches}
                trendingSearches={TRENDING_SEARCHES}
                onSubmit={onSubmit}
                onRemove={onRemoveRecent}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
})

// ─── Main Navbar ──────────────────────────────────────────────────────────────
const Navbar = () => {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const { openLogin, openSignup } = useAuthModal()

  const [isMenuOpen,            setIsMenuOpen]            = useState(false)
  const [isSearchOpen,          setIsSearchOpen]          = useState(false)
  const [isSuggestionsOpen,     setIsSuggestionsOpen]     = useState(false)
  const [isMobileSearchOpen,    setIsMobileSearchOpen]    = useState(false)
  const [searchQuery,           setSearchQuery]           = useState('')
  const [apiSuggestions,        setApiSuggestions]        = useState<any>(null)
  const [isLoadingSuggestions,  setIsLoadingSuggestions]  = useState(false)
  const [mounted,               setMounted]               = useState(false)
  const [isProbablyAuth,        setIsProbablyAuth]        = useState(false)
  const [recentSearches,        setRecentSearches]        = useState<string[]>([])

  const searchRef = useRef<HTMLDivElement>(null)

  // Mount + fast-auth cookie check (single effect)
  useEffect(() => {
    setMounted(true)
    setIsProbablyAuth(document.cookie.split(';').some(c => c.trim().startsWith('is-auth=true')))

    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse recent searches', e)
      }
    }
  }, [])

  // Debounced suggestions fetch
  useEffect(() => {
    if (searchQuery.trim().length < 2) { setApiSuggestions(null); return }

    setIsLoadingSuggestions(true)
    const t = setTimeout(async () => {
      try {
        const res  = await fetch('/api/search_suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery }),
        })
        setApiSuggestions(await res.json())
      } catch { /* silent */ } finally {
        setIsLoadingSuggestions(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  // Desktop click-outside / Escape for suggestions panel
  useEffect(() => {
    if (!isSuggestionsOpen) return

    const onMouseDown = (e: MouseEvent) => {
      if (!searchRef.current?.contains(e.target as Node)) setIsSuggestionsOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSuggestionsOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown',   onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown',   onKeyDown)
    }
  }, [isSuggestionsOpen])

  const handleSearchSubmit = useCallback((q: string) => {
    const query = q.trim()
    if (!query) return

    // Save to recent searches
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== query.toLowerCase())
      const updated = [query, ...filtered].slice(0, 5) // Keep top 5 as requested
      localStorage.setItem('recentSearches', JSON.stringify(updated))
      return updated
    })

    // Log to Database (Most Important)
    fetch('/api/search/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, page: pathname }),
      keepalive: true, // Ensure request finishes even if navigating
    }).catch(e => console.error('Failed to log search history', e))

    setIsSuggestionsOpen(false)
    setIsMobileSearchOpen(false)
    router.push(`/search?query=${encodeURIComponent(query)}`)
  }, [router, pathname])

  const handleRemoveRecentSearch = useCallback((q: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(s => s !== q)
      localStorage.setItem('recentSearches', JSON.stringify(updated))
      return updated
    })
  }, [])

  const handleDesktopKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearchSubmit(searchQuery)
  }, [searchQuery, handleSearchSubmit])

  const handleLogout = useCallback(async () => {
    document.cookie = 'is-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    await signOut({ callbackUrl: '/' })
  }, [])

  const closeMobileSearch = useCallback(() => setIsMobileSearchOpen(false), [])

  return (
    <>
      {/* Mobile overlay — isolated component, won't re-render Navbar internals */}
      {mounted && (
        <MobileSearchOverlay
          isOpen={isMobileSearchOpen}
          query={searchQuery}
          apiSuggestions={apiSuggestions}
          isLoading={isLoadingSuggestions}
          recentSearches={recentSearches}
          onClose={closeMobileSearch}
          onQueryChange={setSearchQuery}
          onSubmit={handleSearchSubmit}
          onRemoveRecent={handleRemoveRecentSearch}
        />
      )}

      <HeroNavbar
        maxWidth="xl"
        position="static"
        isMenuOpen={isMenuOpen}
        onMenuOpenChange={setIsMenuOpen}
        shouldHideOnScroll={false}
        className="bg-white/95 backdrop-blur-md border-b border-zinc-100"
        height="64px"
      >
        {/* Brand */}
        <NavbarBrand className="max-w-fit shrink-0">
          <Link href="/">
            <Image src="/logo.png" alt="Azon Deal Logo" width={130} height={30}
              className="object-contain block lg:hidden w-auto h-6" priority />
            <Image src="/logo.png" alt="AzonDeal Logo" width={150} height={34}
              className="object-contain hidden lg:block w-auto h-8" priority />
          </Link>
        </NavbarBrand>

        {/* Desktop nav links */}
        <NavbarContent className="hidden lg:flex gap-6" justify="center">
          {NAV_LINKS.map((link) => (
            <NavbarItem key={link.href}>
              <Link
                className="flex items-center gap-2 text-[14px] font-semibold text-[#4B5563] hover:text-primary transition-colors"
                href={link.href}
              >
                {link.icon}
                {link.label}
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>

        {/* Right side */}
        <NavbarContent justify="end" className="gap-2 sm:gap-3 flex-1 lg:flex-none">

          {/* Mobile search trigger */}
          <NavbarItem className="flex lg:hidden flex-1 min-w-0 mx-2">
            <button
              onClick={() => setIsMobileSearchOpen(true)}
              className="w-full h-9 rounded-full border border-zinc-200 bg-zinc-50 px-3 flex items-center gap-2 shadow-sm active:scale-[0.98] transition-transform"
            >
              <Search className="h-4 w-4 text-zinc-400 shrink-0" />
              <span className="text-zinc-400 text-[13px] font-medium truncate">Search deals...</span>
            </button>
          </NavbarItem>

          {/* lg only: icon → expandable search */}
          <NavbarItem className="hidden lg:flex xl:hidden items-center">
            {isSearchOpen ? (
              <SearchField aria-label="Search" autoFocus value={searchQuery} onChange={setSearchQuery}>
                <SearchField.Group className="h-10 rounded-full border border-zinc-200 bg-zinc-50 px-3 focus-within:border-primary focus-within:bg-white transition-all shadow-sm">
                  <SearchField.SearchIcon className="h-4 w-4 text-zinc-400" />
                  <SearchField.Input
                    className="w-[200px] bg-transparent text-[14px] outline-none placeholder:text-zinc-400 pl-2"
                    placeholder="Search deals..."
                    autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
                    onBlur={() => setIsSearchOpen(false)}
                    onKeyDown={handleDesktopKeyDown}
                  />
                </SearchField.Group>
              </SearchField>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-zinc-100 transition-colors text-zinc-600 hover:text-primary"
                aria-label="Open search"
              >
                <Search size={20} />
              </button>
            )}
          </NavbarItem>

          {/* xl+: full search bar with suggestions dropdown */}
          <NavbarItem className="hidden xl:flex relative">
            <div className="relative" ref={searchRef}>
              <SearchField aria-label="Search" value={searchQuery} onChange={setSearchQuery}>
                <SearchField.Group className={`h-10 rounded-full border px-4 transition-all duration-200 flex items-center gap-3 w-[320px] z-[1002] ${
                  isSuggestionsOpen ? 'border-primary bg-white shadow-sm' : 'border-zinc-200 bg-zinc-50'
                }`}>
                  <SearchField.SearchIcon className={`h-4 w-4 transition-colors ${isSuggestionsOpen ? 'text-primary' : 'text-zinc-400'}`} />
                  <SearchField.Input
                    className="w-full bg-transparent text-[14px] outline-none placeholder:text-zinc-400 font-medium"
                    placeholder="What are you looking for?"
                    autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
                    onFocus={() => setIsSuggestionsOpen(true)}
                    onKeyDown={handleDesktopKeyDown}    
                  />
                </SearchField.Group>
              </SearchField>

              {isSuggestionsOpen && (
                <div
                  className="absolute top-[calc(100%+8px)] left-0 w-[500px] bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-zinc-100 overflow-y-auto max-h-[600px] z-[1001] animate-in fade-in zoom-in-95 duration-200"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <SearchSuggestions
                    query={searchQuery}
                    apiSuggestions={apiSuggestions}
                    isLoading={isLoadingSuggestions}
                    recentSearches={recentSearches}
                    trendingSearches={TRENDING_SEARCHES}
                    onSubmit={handleSearchSubmit}
                    onRemove={handleRemoveRecentSearch}
                  />
                </div>
              )}
            </div>
          </NavbarItem>

          {/* Auth */}
          {status === 'loading' ? (
            <NavbarItem className="hidden sm:flex items-center">
              {isProbablyAuth && <div className="w-10 h-10 rounded-full bg-zinc-100 animate-pulse" />}
            </NavbarItem>
          ) : session ? (
            <NavbarItem className="hidden sm:flex items-center gap-4">
              <Dropdown>
                <DropdownTrigger>
                  <div className="relative size-10 cursor-pointer group active:scale-95 transition-all duration-300">
                    <div className="absolute inset-0 rounded-full ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300" />
                    {session.user?.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        className="size-full rounded-full object-cover shadow-sm border border-white/10"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user?.name || 'U')}&background=random&color=fff`
                        }}
                      />
                    ) : (
                      <div className="size-full rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase">
                        {session.user?.name?.substring(0, 1) || 'U'}
                      </div>
                    )}
                  </div>
                </DropdownTrigger>
                <DropdownMenu aria-label="Profile Actions" className="w-72 p-2 bg-white border border-zinc-100 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[24px]">
                  <DropdownItem key="profile" textValue="Signed in as" className="h-auto p-4 mb-2 bg-zinc-50/80 rounded-[18px] cursor-default opacity-100">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.2em] leading-none mb-1">Authenticated Account</span>
                      <span className="text-[14px] font-semibold text-zinc-900 truncate">{session.user?.name || 'Member'}</span>
                      <span className="text-[12px] font-medium text-zinc-400 truncate">{session.user?.email}</span>
                    </div>
                  </DropdownItem>
                  <DropdownItem key="settings" textValue="Account Settings" className="rounded-[14px] py-3.5 px-4 hover:bg-zinc-50 transition-colors group" onAction={() => router.push('/settings')}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-zinc-200 transition-colors">
                        <Settings size={18} className="text-zinc-500" />
                      </div>
                      <span className="font-semibold text-[14px] text-zinc-700 group-hover:text-zinc-900">Account Settings</span>
                    </div>
                  </DropdownItem>
                  <DropdownItem key="saved" textValue="My Saved Deals" className="rounded-[14px] py-3.5 px-4 hover:bg-zinc-50 transition-colors group" onAction={() => router.push('/my-deals')}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                        <Heart size={18} className="text-red-500" />
                      </div>
                      <span className="font-semibold text-[14px] text-zinc-700 group-hover:text-zinc-900">My Saved Deals</span>
                    </div>
                  </DropdownItem>
                  <DropdownItem key="logout" color="danger" textValue="Log Out" className="rounded-[14px] py-3.5 px-4 hover:bg-red-50 transition-colors group mt-2" onAction={handleLogout}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                        <LogOut size={18} className="text-red-500" />
                      </div>
                      <span className="font-semibold text-[14px] text-red-500 group-hover:text-red-600">Secure Logout</span>
                    </div>
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </NavbarItem>
          ) : (
            <>
              <NavbarItem className="hidden sm:flex shrink-0">
                <Button variant="ghost" className="rounded-full text-[14px] font-semibold text-[#4B5563] hover:text-primary" onClick={openLogin}>
                  Log in
                </Button>
              </NavbarItem>
              <NavbarItem className="hidden sm:flex shrink-0">
                <Button className="bg-primary text-white text-[14px] font-bold rounded-full h-10 px-6 shadow-lg shadow-primary/20" variant="primary" onClick={openSignup}>
                  Signup
                </Button>
              </NavbarItem>
            </>
          )}

          <NavbarMenuToggle
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            className="lg:hidden text-zinc-600 shrink-0"
          />
        </NavbarContent>

        {/* Mobile hamburger menu */}
        <NavbarMenu className="bg-white/95 backdrop-blur-md pt-6 px-6 z-[999]">
          {NAV_LINKS.map((link, i) => (
            <NavbarMenuItem key={link.href}>
              <Link
                className="w-full flex items-center gap-3 py-3 text-[16px] font-semibold text-[#4B5563] hover:text-primary border-b border-zinc-100"
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.icon}
                {link.label}
              </Link>
            </NavbarMenuItem>
          ))}

          <NavbarMenuItem className="mt-4 flex flex-col gap-3">
            {session ? (
              <div className="flex flex-col gap-4 p-5 bg-zinc-50 rounded-[32px] border border-zinc-100 shadow-sm">
                <div className="flex items-center gap-4 px-1">
                  <div className="size-16 rounded-full ring-4 ring-white shadow-md overflow-hidden bg-primary/10 flex items-center justify-center">
                    {session.user?.image ? (
                      <img src={session.user.image} alt={session.user.name || ''} className="size-full object-cover" />
                    ) : (
                      <span className="text-primary font-semibold text-xl uppercase">
                        {session.user?.name?.substring(0, 2) || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest leading-none">Logged In Account</span>
                    <span className="text-[18px] font-semibold text-zinc-900 leading-tight">{session.user?.name || 'Member'}</span>
                    <span className="text-[13px] font-medium text-zinc-400 truncate">{session.user?.email}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  <Button variant="secondary" className="justify-start font-semibold h-14 rounded-2xl bg-white border border-zinc-100 hover:bg-zinc-50 active:scale-[0.98] transition-all" onPress={() => router.push('/my-deals')}>
                    <div className="w-9 h-9 rounded-full bg-primary/5 flex items-center justify-center mr-3">
                      <TicketPercent size={20} className="text-primary" />
                    </div>
                    My Saved Deals
                  </Button>
                  <Button variant="secondary" className="justify-start font-semibold h-14 rounded-2xl bg-white border border-zinc-100 hover:bg-zinc-50 active:scale-[0.98] transition-all" onPress={() => { setIsMenuOpen(false); router.push('/settings') }}>
                    <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center mr-3">
                      <Settings size={20} className="text-zinc-500" />
                    </div>
                    Account Settings
                  </Button>
                  <Button variant="danger" className="justify-start font-semibold h-14 rounded-2xl bg-red-50/50 text-red-500 border border-red-100 hover:bg-red-50 active:scale-[0.98] transition-all" onPress={handleLogout}>
                    <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center mr-3">
                      <LogOut size={20} className="text-red-600" />
                    </div>
                    Secure Logout
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Button fullWidth variant="secondary" className="font-bold rounded-xl h-12" onClick={() => { openLogin(); setIsMenuOpen(false) }}>
                  Log in
                </Button>
                <Button fullWidth className="bg-primary text-white font-bold rounded-xl h-12 shadow-lg shadow-primary/20" onClick={() => { openSignup(); setIsMenuOpen(false) }}>
                  Signup
                </Button>
              </>
            )}
          </NavbarMenuItem>
        </NavbarMenu>
      </HeroNavbar>
    </>
  )
}

export default Navbar
