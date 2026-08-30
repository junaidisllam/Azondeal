"use client"

import { useRouter, usePathname } from "next/navigation"
import Navbar from "@/components/Navbar"
import dynamic from 'next/dynamic'
import RealtimeTracker from "@/components/analytics/RealtimeTracker"

const Footer = dynamic(() => import('@/components/Footer').then(mod => mod.Footer), {
  ssr: false,
  loading: () => <div className="h-64 bg-zinc-50 animate-pulse" />
})

import { HeroUIProvider } from "@heroui/system"
import { SessionProvider } from "next-auth/react"
import { Toast } from "@heroui/react"

import { AuthModalProvider } from "@/context/AuthModalContext"
import { SettingsProvider } from "@/context/SettingsContext"

export function LayoutWrapper({ 
  children,
  isConfigured = false 
}: { 
  children: React.ReactNode,
  isConfigured?: boolean
}) {
  const pathname = usePathname()
  const isSetup = pathname === "/setup"
  const isAdmin = pathname?.startsWith("/admin")

  const router = useRouter()

  // During setup, or if the database isn't configured yet, we want to avoid 
  // any background API requests (heartbeat, settings, session) that would 
  // fail or cause connection timeouts.
  if (isSetup || !isConfigured) {
    return (
      <HeroUIProvider navigate={router.push}>
        <Toast.Provider placement="top end" className="z-[9999]" />
        <main className="flex-grow">
          {children}
        </main>
      </HeroUIProvider>
    )
  }

  return (
    <SessionProvider>
      <HeroUIProvider navigate={router.push}>
        <Toast.Provider placement="top end" className="z-[9999]" />
        <SettingsProvider>
          <AuthModalProvider>
            <RealtimeTracker />
            <div className="fixed top-0 left-0 right-0 z-[1000] w-full">
              {!isAdmin && <Navbar />}
            </div>
            <main className={`flex-grow ${!isAdmin ? 'pt-16' : ''}`}>
              {children}
            </main>
            {!isAdmin && <Footer />}
          </AuthModalProvider>
        </SettingsProvider>
      </HeroUIProvider>
    </SessionProvider>
  )
}
