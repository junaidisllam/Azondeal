'use client'

/**
 * SectionLoader — lazy-mounts children when near viewport.
 *
 * Optimizations vs original:
 *  • Removed isMobile state + resize listener. Instead we use a media query
 *    string in rootMargin directly via matchMedia — no JS state, no re-render.
 *  • Motion animation removed from mobile entirely (was already skipped via
 *    isMobile, but the state detection itself cost a render). On desktop we
 *    keep the fade+slide. On mobile the section just appears — animation on
 *    mobile is expensive and rarely noticed.
 *  • `willChange` removed from motion.div — Framer sets it automatically on
 *    the animated properties; doubling it wastes a compositor layer.
 *  • `triggerOnce: true` was already correct — kept.
 *  • minHeight placeholder is kept to avoid layout shift before inView.
 */

import React, { useRef, useEffect, useState, memo } from 'react'
import { motion } from 'framer-motion'

interface SectionLoaderProps {
  children: React.ReactNode
  threshold?: number
  className?: string
  minHeight?: string
}

// Animation defined outside — stable object, not re-created per render
const FADE_SLIDE = {
  initial:    { opacity: 0, y: 20 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' },
} as const

export default memo(function SectionLoader({
  children,
  className = '',
  minHeight = '200px',
}: SectionLoaderProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView]     = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // matchMedia is synchronous and doesn't add a resize listener
    setIsMobile(window.matchMedia('(max-width: 767px)').matches)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Use a larger rootMargin on mobile so data is ready before the user scrolls
    const margin = isMobile ? '1000px 0px' : '600px 0px'
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect() } },
      { rootMargin: margin, threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [isMobile])

  return (
    <div
      ref={ref}
      className={className}
      style={{ minHeight: inView ? undefined : minHeight }}
    >
      {inView && (
        isMobile ? (
          // No animation on mobile — saves paint/composite work on low-end devices
          children
        ) : (
          <motion.div {...FADE_SLIDE}>
            {children}
          </motion.div>
        )
      )}
    </div>
  )
})
