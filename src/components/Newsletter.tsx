'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'

export default function Newsletter() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return (
    <div className="max-w-[1280px] mx-auto px-4 pb-20">
      <div className="h-[300px] bg-zinc-900/10 rounded-[48px] animate-pulse" />
    </div>
  )

  return (
    <section className="pb-20">
      <div className="max-w-[1280px] mx-auto px-4">
        <div className="bg-zinc-900 rounded-[48px] p-12 lg:p-20 relative overflow-hidden text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="relative z-10 space-y-6 max-w-xl">
            <h2 className="text-4xl lg:text-6xl font-black text-white leading-tight">Never miss a <br /><span className="text-primary">great deal again.</span></h2>
            <p className="text-zinc-400 text-lg font-medium">Join 50,000+ smart shoppers and get the best promo codes delivered to your inbox.</p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto lg:mx-0">
              <input
                type="email"
                placeholder="Enter your email"
                className="h-14 px-6 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-primary transition-colors flex-1"
                suppressHydrationWarning
              />
              <button className="h-14 px-8 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20">
                Subscribe
              </button>
            </div>
          </div>
          <div className="relative z-10 w-full lg:w-[400px] aspect-square rounded-[32px] overflow-hidden shadow-2xl rotate-3">
             <Image
              src="/image/Shopping_bag_and_voucher_cards_202605052028.jpeg"
              alt="Promo Deals"
              fill
              quality={95}
              loading="lazy"
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 400px"
             />
             <div className="absolute inset-0 bg-primary/20 mix-blend-overlay" />
          </div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
        </div>
      </div>
    </section>
  )
}
