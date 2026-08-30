'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Home, Search, Tag, ArrowLeft, Ghost } from 'lucide-react'
import { Button } from "@heroui/button"
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-[80vh] flex flex-col items-center justify-center bg-white px-4 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative text-center max-w-2xl mx-auto">
        {/* Animated Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ 
            duration: 0.8, 
            type: "spring",
            stiffness: 100 
          }}
          className="inline-flex items-center justify-center w-24 h-24 bg-primary/10 text-primary rounded-3xl mb-8 relative"
        >
          <Ghost size={48} />
          <motion.div 
            animate={{ 
              y: [0, -8, 0],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2,
              ease: "easeInOut"
            }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center text-orange-600 text-[10px] font-black"
          >
            ?
          </motion.div>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[120px] font-black text-zinc-900 leading-none tracking-tighter mb-4"
        >
          404
        </motion.h1>

        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-black text-zinc-800 mb-6"
        >
          Lost in the deals?
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-lg text-zinc-500 font-medium mb-12 leading-relaxed"
        >
          The page you're looking for doesn't exist or has been moved to a new home. 
          But don't worry, we have plenty of other ways to save you money!
        </motion.p>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            as={Link}
            href="/"
            size="lg"
            className="bg-primary text-white font-bold h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-2"
          >
            <Home size={20} />
            Back to Home
          </Button>
          
          <Button
            as={Link}
            href="/brands"
            variant="ghost"
            size="lg"
            className="bg-zinc-100 text-zinc-900 font-bold h-14 px-8 rounded-2xl flex items-center gap-2"
          >
            <Tag size={20} />
            Explore Brands
          </Button>
        </motion.div>

        {/* Quick Links */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-16 pt-12 border-t border-zinc-100"
        >
          <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6">Popular Pages</h4>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            <Link href="/top-deals" className="text-sm font-bold text-zinc-600 hover:text-primary transition-colors flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
              Top Deals
            </Link>
            <Link href="/faq" className="text-sm font-bold text-zinc-600 hover:text-primary transition-colors flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              Help Center
            </Link>
            <Link href="/contact" className="text-sm font-bold text-zinc-600 hover:text-primary transition-colors flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
              Contact Us
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
