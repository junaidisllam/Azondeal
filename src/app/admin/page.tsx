'use client'
import React, { useState, useEffect } from "react"
import { Card, CardBody } from "@heroui/card"
import { Skeleton } from "@heroui/skeleton"
import { 
  ShoppingBag, 
  Layers, 
  Grid2X2, 
  TrendingUp,
  Clock,
  ExternalLink,
  Sparkles,
  Users,
  MousePointerClick,
  Activity,
  Globe,
  Monitor,
  Smartphone,
  FolderOpen,
  MapPin,
  ChevronRight
} from "lucide-react"
import { Accordion, AccordionItem, Chip } from "@heroui/react"
import Link from "next/link"
import Image from "next/image"

interface DashboardData {
  totalCategories: number
  totalUsers: number
  totalClicks: number
  activity: {
    today: number
    yesterday: number
    month: number
    lastMonth: number
  }
  live: {
    count: number
    visitors: {
      visitorId: string
      userId?: string
      userName?: string
      countryCode?: string
      ip: string
      device: string
      updatedAt: string
      pages: string[]
    }[]
  }
}

const getFlagEmoji = (countryCode: string) => {
  if (countryCode === 'local') return '💻'
  if (!countryCode || countryCode === 'unknown') return '🏳️'
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0))
    return String.fromCodePoint(...codePoints)
  } catch {
    return '🏳️'
  }
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    // Poll for real-time updates every 30 seconds (optimized for server load)
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/dashboard/stats')
      const stats = await res.json()
      setData(stats)
    } catch (err) {
      console.error('Failed to fetch stats', err)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: "Live Visitors", value: data?.live?.count || 0, icon: <Activity className="animate-pulse" />, color: "text-emerald-500", bg: "bg-emerald-50", isLive: true },
    { label: "Categories", value: data?.totalCategories || 0, icon: <Grid2X2 />, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Total Users", value: data?.totalUsers || 0, icon: <Users />, color: "text-purple-500", bg: "bg-purple-50" },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 pb-8 space-y-10">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && !data ? Array(3).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-[24px]" />
        )) : statCards.map((stat, i) => (
          <Card key={i} className={`border-none shadow-sm rounded-[24px] bg-white hover:shadow-md transition-all ${stat.isLive ? 'ring-2 ring-emerald-500/20' : ''}`}>
            <CardBody className="p-6 flex flex-row items-center gap-6">
              <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shadow-sm`}>
                {React.cloneElement(stat.icon as React.ReactElement<any>, { size: 24 })}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-zinc-400 text-[10px] font-black uppercase tracking-wider">{stat.label}</span>
                    {stat.isLive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />}
                </div>
                <span className="text-2xl font-black text-zinc-900">
                  {stat.value.toLocaleString()}
                </span>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Activity & Live Traffic */}
        <div className="lg:col-span-2 space-y-8">
          {/* Live Visitors Monitor (Custom Premium UI) */}
          <div className="bg-zinc-900 rounded-[40px] p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl border border-white/5">
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Globe className="text-primary" size={24} />
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">Live Monitor</h3>
                  </div>
                  <p className="text-zinc-500 text-sm font-bold ml-13">Real-time engagement tracking</p>
                </div>
                <div className="flex items-center gap-6 bg-white/5 p-4 rounded-[24px] border border-white/5 backdrop-blur-md">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">Active Now</span>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            <span className="text-2xl font-black text-white leading-none">{data?.live?.count || 0}</span>
                        </div>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">Unique</span>
                        <span className="text-2xl font-black text-primary leading-none">{data?.live?.visitors?.length || 0}</span>
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {data?.live?.visitors && data.live.visitors.length > 0 ? (
                  data.live.visitors.map((visitor, i) => (
                    <div 
                      key={visitor.visitorId || i}
                      className="group relative bg-white/5 hover:bg-white/[0.08] border border-white/5 hover:border-white/10 transition-all duration-500 rounded-[32px] p-6 sm:p-8 overflow-hidden"
                    >
                      {/* Background Glow */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px] group-hover:bg-primary/10 transition-colors" />

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start relative z-10">
                        {/* Section 1: User Identity (4 cols) */}
                        <div className="md:col-span-4 flex items-center gap-5">
                          <div className="relative flex-shrink-0">
                            <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center shadow-2xl border border-white/10 group-hover:scale-105 transition-transform duration-500">
                              {visitor.countryCode === 'local' ? (
                                <Monitor size={28} className="text-primary" />
                              ) : (
                                <Globe size={28} className="text-zinc-400 group-hover:text-primary transition-colors" />
                              )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-emerald-500 border-4 border-zinc-900 animate-pulse" />
                          </div>
                          
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-base font-black text-white truncate max-w-[150px]">
                                    {visitor.userName || `Visitor ${visitor.visitorId.slice(-6).toUpperCase()}`}
                                </span>
                                {visitor.userId && (
                                    <Chip size="sm" className="bg-primary/20 text-primary text-[8px] font-black uppercase border-none h-4">User</Chip>
                                )}
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-zinc-500">
                                    <MapPin size={10} className="text-primary/60" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{visitor.ip === '::1' ? 'Localhost' : visitor.ip}</span>
                                </div>
                                <div className="flex items-center gap-2 text-zinc-500">
                                    {visitor.countryCode === 'local' ? <Monitor size={10} className="text-primary/60" /> : <Globe size={10} className="text-primary/60" />}
                                    <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                                        {visitor.countryCode === 'local' ? 'Dev Server' : (visitor.countryCode || 'Unknown')}
                                    </span>
                                </div>
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Activity (5 cols) */}
                        <div className="md:col-span-5 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Activity Track</span>
                                <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md uppercase">{visitor.pages.length} Active</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                {visitor.pages.slice(0, 3).map((path, idx) => (
                                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
                                        <div className="w-1 h-1 rounded-full bg-primary" />
                                        <span className="text-[11px] font-bold text-zinc-400 truncate">{path || '/'}</span>
                                    </div>
                                ))}
                                {visitor.pages.length > 3 && (
                                    <span className="text-[9px] text-zinc-600 font-bold ml-2">+{visitor.pages.length - 3} more pages...</span>
                                )}
                            </div>
                        </div>

                        {/* Section 3: Tech Info (3 cols) */}
                        <div className="md:col-span-3 flex flex-row md:flex-col justify-between gap-4 md:border-l md:border-white/5 md:pl-6">
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Device</span>
                                <div className="flex items-center gap-2 text-zinc-300">
                                    {visitor.device?.toLowerCase().includes('mobile') ? <Smartphone size={12} /> : <Monitor size={12} />}
                                    <span className="text-[11px] font-bold truncate">
                                        {visitor.device?.split('(')[0].trim().replace('Mozilla/5.0', 'Desktop') || 'Unknown'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Time</span>
                                <div className="flex items-center gap-2 text-zinc-300">
                                    <Clock size={12} />
                                    <span className="text-[11px] font-bold">
                                        {new Date(visitor.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center bg-white/5 rounded-[40px] border border-dashed border-white/10">
                    <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                        <Activity size={32} className="text-zinc-600" />
                    </div>
                    <p className="text-zinc-500 font-bold italic">Waiting for visitors to connect...</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
          </div>

          <div className="bg-white rounded-[40px] p-8 sm:p-12 shadow-sm border border-zinc-50">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-black text-zinc-900 uppercase tracking-tight flex items-center gap-3">
                  <TrendingUp className="text-primary" />
                  Performance Trends
                </h3>
                <p className="text-zinc-400 text-sm font-bold mt-1">Engagement over time</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { label: "Today", value: data?.activity.today, sub: "Since 12:00 AM", color: "bg-blue-600" },
                { label: "Yesterday", value: data?.activity.yesterday, sub: "Previous 24h", color: "bg-zinc-800" },
                { label: "This Month", value: data?.activity.month, sub: "Current month", color: "bg-emerald-600" },
                { label: "Last Month", value: data?.activity.lastMonth, sub: "Previous month", color: "bg-orange-600" }
              ].map((act, i) => (
                <div key={i} className="p-8 rounded-[32px] bg-zinc-50/50 border border-zinc-100 hover:border-zinc-200 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{act.label}</span>
                    <div className={`w-2 h-2 rounded-full ${act.color} animate-pulse`} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-4xl font-black text-zinc-900 group-hover:text-primary transition-colors">
                      {loading && !data ? "..." : (act.value || 0).toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-zinc-400 mt-2">{act.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
           {/* Quick Actions */}
           <div className="bg-white rounded-[40px] p-8 border border-zinc-100 shadow-sm">
            <h3 className="text-xl font-black uppercase tracking-tight mb-8">Shortcuts</h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: "Hero Banners", href: "/admin/hero", icon: <Layers size={18} /> },
                { label: "Search History", href: "/admin/search-history", icon: <Clock size={18} /> },
                { label: "Contact Inbox", href: "/admin/contacts", icon: <Sparkles size={18} /> },
                { label: "Click Analytics", href: "/admin/clicks", icon: <MousePointerClick size={18} /> },
                { label: "Settings", href: "/admin/app-settings", icon: <Grid2X2 size={18} /> },
              ].map((item, i) => (
                <Link 
                  key={i} 
                  href={item.href}
                  className="p-5 rounded-2xl bg-zinc-50 border border-transparent hover:border-zinc-200 hover:bg-white transition-all flex items-center gap-4 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-zinc-400 group-hover:text-primary transition-colors">
                    {item.icon}
                  </div>
                  <span className="text-sm font-bold text-zinc-700">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Active Performance Card */}
          <div className="bg-primary rounded-[40px] p-8 text-white shadow-xl shadow-primary/20">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 opacity-60">Total Engagement</h3>
            <div className="space-y-8">
              <div className="flex flex-col">
                <span className="text-[40px] font-black leading-none">{data?.totalClicks.toLocaleString() || 0}</span>
                <span className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-80">Lifetime Affiliate Clicks</span>
              </div>
              <div className="pt-8 border-t border-white/20">
                 <Link href="/admin/clicks" className="w-full h-12 rounded-2xl bg-white text-primary flex items-center justify-center text-xs font-black uppercase tracking-widest hover:bg-zinc-100 transition-colors">
                   Detailed Report
                 </Link>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-[40px] p-8 border border-zinc-100 shadow-sm">
             <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                System Health
             </h3>
             <div className="space-y-4">
                {[
                  { label: "Database", status: "Active", icon: <Layers size={14} /> },
                  { label: "Real-time Hub", status: "Running", icon: <Globe size={14} /> },
                  { label: "API Mesh", status: "Stable", icon: <Sparkles size={14} /> }
                ].map((sys, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-transparent">
                    <div className="flex items-center gap-3">
                       <span className="text-zinc-400">{sys.icon}</span>
                       <span className="font-bold text-xs text-zinc-700">{sys.label}</span>
                    </div>
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg uppercase tracking-widest">{sys.status}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
