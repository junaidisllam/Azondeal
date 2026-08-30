'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { Avatar, Button, Spinner, Pagination, SearchField } from "@heroui/react"
import { Eye, Trash2, Calendar, Search, MessageSquare, Clock } from 'lucide-react'
import Link from 'next/link'

interface ContactMessage {
  id: number
  name: string
  email: string
  subject: string
  message: string
  createdAt: string
}

export default function AdminContactsPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  const loadData = useCallback(async (pageNum: number, search: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/contacts/list?page=${pageNum}&limit=10&search=${encodeURIComponent(search)}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages)
        setTotalPages(data.pagination.totalPages)
        setTotalCount(data.pagination.total)
      }
    } catch (error) {
      console.error('Error loading contacts:', error)
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
    if (!confirm('Are you sure you want to delete this message?')) return
    try {
      const res = await fetch(`/api/admin/contacts/${id}`, { method: 'DELETE' })
      if (res.ok) {
        loadData(page, searchTerm)
      }
    } catch (error) {
      alert('Failed to delete message')
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Contact Messages</h1>
          <p className="text-zinc-500 font-medium mt-1">Manage and respond to user inquiries</p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <SearchField 
            value={searchTerm} 
            onChange={handleSearch}
            className="w-full sm:w-72"
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search name, email or subject..." />
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
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="text-left text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-8 py-6">Sender</th>
                <th className="text-left text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-8 py-6">Subject & Message</th>
                <th className="text-left text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-8 py-6">Timestamp</th>
                <th className="text-center text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-8 py-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {messages.length > 0 ? messages.map((item) => (
                <tr key={item.id} className="group hover:bg-zinc-50/40 transition-all duration-300">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12 ring-2 ring-white shadow-sm bg-primary/10">
                        <Avatar.Fallback className="text-primary font-black text-xl">
                          {item.name.substring(0, 2).toUpperCase()}
                        </Avatar.Fallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-base font-black text-zinc-900 group-hover:text-primary transition-colors">{item.name}</span>
                        <span className="text-xs text-zinc-400 font-bold">{item.email}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-8 py-6">
                    <div className="flex flex-col max-w-[300px]">
                      <p className="text-sm font-black text-zinc-900 mb-1 line-clamp-1">{item.subject}</p>
                      <p className="text-xs text-zinc-400 font-medium line-clamp-1 italic">"{item.message}"</p>
                    </div>
                  </td>

                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2.5 text-zinc-500">
                      <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center shrink-0">
                        <Calendar size={14} className="text-zinc-400" />
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

                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-3">
                      <Link href={`/admin/contacts/${item.id}`}>
                        <Button isIconOnly variant="ghost" size="sm" className="rounded-xl bg-zinc-100 text-zinc-500">
                          <Eye size={18} />
                        </Button>
                      </Link>
                      <Button isIconOnly variant="ghost" size="sm" onPress={() => handleDelete(item.id)} className="rounded-xl text-danger hover:bg-danger-50">
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </td>
                </tr>
              )) : !isLoading && (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="text-zinc-200" size={32} />
                    </div>
                    <p className="text-zinc-400 font-black">No messages found.</p>
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
