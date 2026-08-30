'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { Avatar, Button, Spinner, Pagination, Tooltip, Chip, SearchField } from "@heroui/react"
import { Search, Trash2, Calendar, Monitor, Globe, User, Clock, Info } from 'lucide-react'

interface SearchHistory {
  id: number
  query: string
  device: string
  page: string
  userId: string | null
  ip: string | null
  createdAt: string
}

export default function AdminSearchHistoryPage() {
  const [history, setHistory] = useState<SearchHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  const loadData = useCallback(async (pageNum: number, search: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/search-history/list?page=${pageNum}&limit=10&search=${encodeURIComponent(search)}`)
      if (res.ok) {
        const data = await res.json()
        setHistory(data.history)
        setTotalPages(data.pagination.totalPages)
        setTotalCount(data.pagination.total)
      }
    } catch (error) {
      console.error('Error loading search history:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData(page, searchTerm)
  }, [page, loadData])

  const handleSearch = (val: string) => {
    setSearchTerm(val)
    setPage(1)
    loadData(1, val)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this search record?')) return
    try {
      const res = await fetch(`/api/admin/search-history/${id}`, { method: 'DELETE' })
      if (res.ok) {
        loadData(page, searchTerm)
      }
    } catch (error) {
      alert('Failed to delete search record')
    }
  }

  const parseUserAgent = (ua: string) => {
    if (!ua) return { label: 'Unknown', color: 'default' as const }
    if (ua.includes('Mobi')) return { label: 'Mobile', color: 'warning' as const }
    return { label: 'Desktop', color: 'success' as const }
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Search Analytics</h1>
          <p className="text-zinc-500 font-medium mt-1">Track and analyze what users are looking for</p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <SearchField 
            value={searchTerm} 
            onChange={handleSearch}
            className="w-full sm:w-72"
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search queries, IP..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <div className="bg-zinc-100 px-4 py-2.5 rounded-2xl shrink-0">
            <span className="text-sm font-bold text-zinc-900">{totalCount}</span>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Total</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-zinc-200/50 border border-zinc-100 overflow-hidden relative min-h-[400px]">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <Spinner color="current" className="text-primary" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="text-left text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-8 py-6">Search Query</th>
                <th className="text-left text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-8 py-6">Context</th>
                <th className="text-left text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-8 py-6">User Info</th>
                <th className="text-left text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-8 py-6">Time</th>
                <th className="text-center text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-8 py-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {history.length > 0 ? history.map((item) => {
                const device = parseUserAgent(item.device || '')
                return (
                  <tr key={item.id} className="group hover:bg-zinc-50/40 transition-all duration-300">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <Search size={18} />
                        </div>
                        <span className="text-base font-black text-zinc-900 line-clamp-1">{item.query}</span>
                      </div>
                    </td>

                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Chip size="sm" color={device.color} className="font-bold uppercase text-[10px]">
                            {device.label}
                          </Chip>
                          <div title={item.device} className="p-1 bg-zinc-100 rounded-md cursor-help">
                            <Info size={10} className="text-zinc-400" />
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
                          <Globe size={12} />
                          <span className="text-xs truncate max-w-[150px]">{item.page}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar 
                            className="w-8 h-8 ring-2 ring-white shadow-sm bg-primary/10 shrink-0"
                            size="sm"
                          >
                            {(item as any).user_image && <Avatar.Image src={(item as any).user_image} alt={(item as any).user_name || ""} />}
                            <Avatar.Fallback>
                              <User size={14} className="text-primary" />
                            </Avatar.Fallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-black text-zinc-900 truncate max-w-[120px]">
                              {(item as any).user_name || "Guest User"}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-medium">
                              {item.userId ? "Registered" : "Anonymous"}
                            </span>
                          </div>
                        </div>
                        {item.ip && (
                          <div className="flex items-center gap-1.5 text-zinc-400 pl-1">
                            <Globe size={12} className="text-zinc-300" />
                            <span className="text-[10px] font-bold tracking-tight">{item.ip}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400">
                          <Clock size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-zinc-900">
                            {new Date(item.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-bold uppercase">
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-8 py-6 text-center">
                      <Button
                        isIconOnly
                        variant="ghost"
                        size="sm"
                        onPress={() => handleDelete(item.id)}
                        className="rounded-xl text-danger hover:bg-danger-50"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </td>
                  </tr>
                )
              }) : !isLoading && (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="text-zinc-200" size={32} />
                    </div>
                    <p className="text-zinc-400 font-black">No searches found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm gap-4">
        <Pagination className="w-full">
          <Pagination.Summary className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
            Showing Page {page} of {totalPages} ({totalCount} total)
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
  )
}
