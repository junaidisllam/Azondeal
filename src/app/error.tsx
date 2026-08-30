'use client'

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCcw, Home, MessageCircle } from 'lucide-react'
import { Button } from "@heroui/button"
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application Error:', error)
  }, [error])

  return (
    <main className="min-h-[80vh] flex flex-col items-center justify-center bg-white px-4 relative">
      {/* Background Accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative text-center max-w-xl mx-auto">
        {/* Error Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl mb-8"
        >
          <AlertTriangle size={40} />
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-black text-zinc-900 mb-4 tracking-tight"
        >
          Something went wrong
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-zinc-500 font-medium mb-12"
        >
          We encountered an unexpected error. Don't worry, we've been notified and are looking into it.
        </motion.p>

        {/* Error Details (Optional/Hidden in Prod usually, but good for debugging) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-8 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 text-left overflow-auto max-h-32">
            <p className="text-xs font-mono text-zinc-400 break-all">{error.message}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            onPress={() => reset()}
            size="lg"
            className="bg-primary text-white font-bold h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-2 w-full sm:w-auto"
          >
            <RefreshCcw size={20} />
            Try Again
          </Button>
          
          <Button
            as={Link}
            href="/"
            variant="ghost"
            size="lg"
            className="bg-zinc-100 text-zinc-900 font-bold h-14 px-8 rounded-2xl flex items-center gap-2 w-full sm:w-auto"
          >
            <Home size={20} />
            Go Home
          </Button>
        </div>

        {/* Support Link */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <p className="text-sm text-zinc-400 font-medium">
            Still having issues?{' '}
            <Link href="/contact" className="text-primary font-bold hover:underline inline-flex items-center gap-1">
              Contact Support <MessageCircle size={14} />
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  )
}
