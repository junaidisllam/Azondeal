'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  List, 
  MessageSquare, 
  UserCircle, 
  Settings, 
  Shield, 
  ExternalLink,
  Sparkles,
  MousePointerClick,
  X
} from 'lucide-react'
import { Button } from '@heroui/react'

export default function AdminNav({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Hero Section', href: '/admin/hero', icon: Sparkles },
    { name: 'Categories', href: '/admin/categories', icon: List },
    { name: 'Search History', href: '/admin/search-history', icon: List },
    { name: 'Contacts', href: '/admin/contacts', icon: MessageSquare },
    { name: 'Users', href: '/admin/users', icon: UserCircle },
    { name: 'Affiliate Clicks', href: '/admin/clicks', icon: MousePointerClick },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ]

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-8">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-8 w-auto object-contain"
              />
            </Link>
            <div className="h-6 w-[1px] bg-zinc-200 mx-1 hidden sm:block" />
            <div>
              <h1 className="text-lg font-black text-zinc-900 tracking-tighter leading-none uppercase">Admin</h1>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Control Panel</p>
            </div>
          </div>
          {onClose && (
            <Button isIconOnly variant="ghost" onPress={onClose} className="lg:hidden">
              <X size={20} />
            </Button>
          )}
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-primary/5 text-primary shadow-sm shadow-primary/5' 
                  : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
              }`}
            >
              <item.icon size={20} className={isActive ? 'text-primary' : 'text-zinc-400 group-hover:text-zinc-600'} />
              <span className={`font-semibold text-sm tracking-tight ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                {item.name}
              </span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-6 mt-auto border-t border-zinc-50">
        <Link 
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 transition-all font-bold text-sm"
        >
          <ExternalLink size={18} />
          Back to Website
        </Link>
      </div>
    </div>
  )
}
