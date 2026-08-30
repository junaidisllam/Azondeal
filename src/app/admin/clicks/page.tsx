'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  MousePointerClick, 
  Search, 
  ExternalLink, 
  Clock, 
  Monitor, 
  Globe, 
  ShoppingBag,
  TicketPercent,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react'
import { Pagination, Spinner, Button, SearchField, Avatar } from '@heroui/react'
import Link from 'next/link'

export default function AffiliateClicksPage() {
  const [clicks, setClicks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalClicks, setTotalClicks] = useState(0)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ promo: 0, direct: 0 })

  const fetchClicks = useCallback(async (pageNum: number, searchStr: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/analytics/clicks?page=${pageNum}&limit=10&search=${encodeURIComponent(searchStr)}`)
      const data = await res.json()
      if (data.clicks) {
        setClicks(data.clicks)
        setTotalPages(data.pagination.totalPages)
        setTotalClicks(data.pagination.total)
        
        // Update stats (simplified for now, ideally from a separate stats API)
        if (pageNum === 1 && !searchStr) {
          const promoCount = data.clicks.filter((c: any) => c.type === 'promo_copy').length
          setStats({ promo: promoCount, direct: data.clicks.length - promoCount })
        }
      }
    } catch (error) {
      console.error('Failed to fetch clicks:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClicks(page, search)
  }, [page, fetchClicks])

  const handleSearchChange = (val: string) => {
    setSearch(val)
    setPage(1) // Reset to first page on search
    fetchClicks(1, val)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Premium Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
            <MousePointerClick size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Clicks</p>
            <h2 className="text-2xl font-black text-zinc-900">{totalClicks}</h2>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <TicketPercent size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Recent Promo</p>
            <h2 className="text-2xl font-black text-zinc-900">{stats.promo}</h2>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Recent Direct</p>
            <h2 className="text-2xl font-black text-zinc-900">{stats.direct}</h2>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-zinc-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-zinc-900">Click Activity</h3>
            <p className="text-sm text-zinc-500 font-medium">Monitoring latest outbound traffic</p>
          </div>
          <div className="w-full sm:w-72">
            <SearchField 
              value={search} 
              onChange={handleSearchChange}
              className="w-full"
            >
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Search ASIN, IP or Country..." />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px] relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <Spinner color="current" className="text-primary" />
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-zinc-50/50">
                  <th className="px-8 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Product & Type</th>
                  <th className="px-8 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">User & Location</th>
                  <th className="px-8 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Affiliate Data</th>
                  <th className="px-8 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Timestamp</th>
                  <th className="px-8 py-4"></th>
                </tr>
              </thead>
            <tbody className="divide-y divide-zinc-50">
              {clicks.length > 0 ? clicks.map((click) => (
                <tr key={click.id} className="hover:bg-zinc-50/50 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl border border-zinc-100 flex-shrink-0 overflow-hidden p-1 flex items-center justify-center">
                        {click.product_image ? (
                          <img src={click.product_image} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <ShoppingBag className="text-zinc-200" size={20} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-zinc-900 truncate max-w-[240px] group-hover:text-primary transition-colors">
                          {click.title || 'Amazon Product'}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter bg-zinc-100 px-1.5 py-0.5 rounded">
                            {click.asin}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            click.type === 'promo_copy' 
                              ? 'bg-emerald-50 text-emerald-600' 
                              : 'bg-blue-50 text-blue-600'
                          }`}>
                            {click.type === 'promo_copy' ? 'PROMO' : 'DIRECT'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar 
                          className="w-7 h-7 ring-2 ring-white shadow-sm bg-primary/10 shrink-0"
                          size="sm"
                        >
                          {click.user_image && <Avatar.Image src={click.user_image} alt={click.user_name || ""} />}
                          <Avatar.Fallback>
                            <User size={12} className="text-primary" />
                          </Avatar.Fallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-black text-zinc-900 truncate">
                            {click.user_name || "Guest User"}
                          </span>
                          {click.user_role && (
                            <span className="text-[9px] font-bold text-primary uppercase tracking-tighter">
                              {click.user_role}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500">
                            <Globe size={10} className="text-zinc-300" />
                            {click.ip}
                          </div>
                          {click.country && (
                            <span className="text-[9px] font-black bg-zinc-900 text-white px-1 py-0.5 rounded uppercase tracking-tighter">
                              {click.country}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-medium max-w-[180px] truncate">
                          <Monitor size={12} className="shrink-0" />
                          {click.device?.split(') ')[0]?.replace('Mozilla/5.0 (', '') || 'Unknown Device'}
                        </div>
                      </div>
                    </div>
                  </td>
                <td className="px-8 py-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-zinc-400">TAG</span>
                        <span className="text-[11px] font-black text-zinc-800">{click.affiliateId}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-zinc-400">MER</span>
                        <span className="text-[11px] font-medium text-zinc-500 truncate max-w-[80px]">{click.merchantId || 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                        <Clock size={12} className="text-zinc-400" />
                        {new Date(click.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-medium mt-0.5 flex items-center gap-1.5">
                        <Calendar size={12} />
                        {new Date(click.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <Link 
                      href={`https://www.amazon.com/dp/${click.asin}`} 
                      target="_blank"
                      className="inline-flex items-center justify-center size-9 rounded-xl bg-zinc-50 text-zinc-400 hover:bg-primary hover:text-white transition-all shadow-sm"
                    >
                      <ExternalLink size={16} />
                    </Link>
                  </td>
                </tr>
              )) : !isLoading && (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-zinc-50 rounded-[24px] flex items-center justify-center text-zinc-200">
                        <Layers size={40} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-black text-zinc-900">No data found</h4>
                        <p className="text-sm text-zinc-400 font-medium">Try adjusting your search criteria</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        </div>
        
        {/* Pagination Section */}
        <div className="px-8 py-6 bg-zinc-50/50 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Pagination className="w-full">
            <Pagination.Summary className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              Showing Page {page} of {totalPages} ({totalClicks} total)
            </Pagination.Summary>
            <Pagination.Content>
              <Pagination.Item>
                <Pagination.Previous 
                  isDisabled={page === 1}
                  onPress={() => setPage(page - 1)}
                >
                  <Pagination.PreviousIcon />
                  <span>Prev</span>
                </Pagination.Previous>
              </Pagination.Item>

              {(() => {
                const items = [];
                const delta = 2;
                const left = page - delta;
                const right = page + delta + 1;
                const range = [];
                const rangeWithDots = [];
                let l;

                for (let i = 1; i <= totalPages; i++) {
                  if (i === 1 || i === totalPages || (i >= left && i < right)) {
                    range.push(i);
                  }
                }

                for (const i of range) {
                  if (l) {
                    if (i - l === 2) {
                      rangeWithDots.push(l + 1);
                    } else if (i - l !== 1) {
                      rangeWithDots.push("...");
                    }
                  }
                  rangeWithDots.push(i);
                  l = i;
                }

                return rangeWithDots.map((p, idx) => (
                  <Pagination.Item key={idx}>
                    {p === "..." ? (
                      <Pagination.Ellipsis />
                    ) : (
                      <Pagination.Link
                        isActive={p === page}
                        onPress={() => setPage(p as number)}
                      >
                        {p}
                      </Pagination.Link>
                    )}
                  </Pagination.Item>
                ));
              })()}

              <Pagination.Item>
                <Pagination.Next 
                  isDisabled={page === totalPages}
                  onPress={() => setPage(page + 1)}
                >
                  <span>Next</span>
                  <Pagination.NextIcon />
                </Pagination.Next>
              </Pagination.Item>
            </Pagination.Content>
          </Pagination>
        </div>
      </div>
    </div>
  )
}
