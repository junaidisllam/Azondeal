'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface Settings {
  amazon_affiliate_id: string
  ebay_affiliate_id: string
  walmart_affiliate_id: string
  bestbuy_affiliate_id: string
  macys_affiliate_id: string
  newegg_affiliate_id: string
  woot_affiliate_id: string
}

interface SettingsContextType {
  settings: Settings
  isLoading: boolean
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>({
    amazon_affiliate_id: 'azondeal-20',
    ebay_affiliate_id: '',
    walmart_affiliate_id: '',
    bestbuy_affiliate_id: '',
    macys_affiliate_id: '',
    newegg_affiliate_id: '',
    woot_affiliate_id: '',
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/settings')
        const data = await response.json()
        setSettings({
          amazon_affiliate_id: data.amazon_affiliate_id || 'azondeal-20',
          ebay_affiliate_id: data.ebay_affiliate_id || '',
          walmart_affiliate_id: data.walmart_affiliate_id || '',
          bestbuy_affiliate_id: data.bestbuy_affiliate_id || '',
          macys_affiliate_id: data.macys_affiliate_id || '',
          newegg_affiliate_id: data.newegg_affiliate_id || '',
          woot_affiliate_id: data.woot_affiliate_id || '',
        })
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
