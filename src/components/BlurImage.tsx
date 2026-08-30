'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { ShoppingBag } from 'lucide-react'

type ImgState = 'loading' | 'loaded' | 'error'

function optimizeAmazonSrc(src: string): string {
  if (!src || (!src.includes('amazon.com') && !src.includes('ssl-images-amazon.com'))) return src
  return /\._AC_.*_\./.test(src) ? src.replace(/\._AC_.*_\./, '._AC_SY300_.') : src
}

/**
 * A highly optimized Image component that handles:
 * 1. Smooth blur-in transition
 * 2. Amazon image resizing for performance
 * 3. Absolute URL construction for local uploads to fix production optimization
 * 4. Error states and fallbacks
 */
export function BlurImage({
  src,
  alt,
  className,
  priority,
  sizes,
  fill = true,
  width,
  height,
  objectFit = 'contain',
  quality = 75
}: {
  src: string
  alt: string
  className?: string
  priority?: boolean
  sizes?: string
  fill?: boolean
  width?: number
  height?: number
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  quality?: number
}) {
  const [imgState, setImgState] = useState<ImgState>('loading')

  if (!src) {
    return (
      <div className="absolute inset-0 bg-zinc-50 flex flex-col items-center justify-center p-4">
        <ShoppingBag className="text-zinc-200" size={32} />
      </div>
    )
  }

  const optimizedSrc = optimizeAmazonSrc(src)
  const isExternal = optimizedSrc?.startsWith('http') && !optimizedSrc.includes('azondeal.com') && !optimizedSrc.includes('activevoucher.com')
  const isData = optimizedSrc?.startsWith('data:')

  // Construct absolute URL for local uploads to fix Hostinger optimization issues in production
  let finalSrc = optimizedSrc
  if (optimizedSrc?.startsWith('/uploads/')) {
    // We only force absolute URLs in production to bypass hosting environment limitations.
    // On localhost (development), we keep relative paths so developers can see local uploads.
    const isDev = process.env.NODE_ENV === 'development';

    if (!isDev) {
      const siteUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'https://azondeal.com'
      finalSrc = `${siteUrl}${optimizedSrc}`
    }
  }

  const imgClass = `${fill ? 'absolute inset-0' : ''} w-full h-full transition-all duration-700 ease-in-out transform-gpu ${
    imgState === 'loaded' ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
  } ${objectFit === 'contain' ? 'object-contain' : 'object-cover'} ${className || ''}`

  return (
    <div className={`relative ${fill ? 'absolute inset-0' : ''} w-full h-full bg-zinc-50 overflow-hidden`}>
      {imgState === 'loading' && (
        <div className="absolute inset-0 bg-zinc-100 sm:animate-pulse flex items-center justify-center z-10">
          <ShoppingBag className="text-zinc-200" size={24} />
        </div>
      )}

      {imgState === 'error' ? (
        <div className="absolute inset-0 bg-zinc-50 flex flex-col items-center justify-center p-4">
          <ShoppingBag className="text-zinc-200 mb-1" size={32} />
          <span className="text-[10px] text-zinc-300 font-medium text-center">Image not available</span>
        </div>
      ) : (isExternal || isData) ? (
        <img
          src={finalSrc}
          alt={alt}
          className={imgClass}
          onLoad={() => setImgState('loaded')}
          onError={() => setImgState('error')}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
        />
      ) : (
        <Image
          src={finalSrc}
          alt={alt}
          fill={fill}
          width={width}
          height={height}
          className={imgClass}
          priority={priority}
          sizes={sizes}
          quality={quality}
          onLoad={() => setImgState('loaded')}
          onError={() => setImgState('error')}
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  )
}
