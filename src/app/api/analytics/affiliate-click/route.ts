import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { asin, title, type, affiliateId, merchantId, page } = body

    if (!asin) {
      return NextResponse.json({ error: 'ASIN is required' }, { status: 400 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const device = req.headers.get('user-agent') || 'unknown'
    
    // Attempt to get country from headers (Common in hosting providers like Vercel, Cloudflare, etc.)
    let country = req.headers.get('x-vercel-ip-country') || 
                  req.headers.get('cf-ipcountry') || 
                  req.headers.get('x-country-code') || 
                  null

    // If no header, and IP is not local/unknown, try a quick GeoIP lookup
    if (!country && ip !== 'unknown' && ip !== '127.0.0.1' && ip !== '::1') {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=country`, { signal: AbortSignal.timeout(1000) })
        if (geoRes.ok) {
          const geoData = await geoRes.json()
          country = geoData.country || null
        }
      } catch (e) {
        console.error('[GeoIP] Lookup failed:', e)
      }
    }

    let userId: string | null = null
    try {
      const session = await auth()
      userId = session?.user?.id || session?.user?.email || null
    } catch (e) {
      // Ignore auth errors for tracking
    }

    // Store in database using Prisma
    await db.affiliateclick.create({
      data: {
        asin,
        title: title || null,
        ip,
        device,
        country,
        page: page || null,
        type: type || null,
        affiliateId: affiliateId || null,
        merchantId: merchantId || null,
        userId
      }
    })

    return NextResponse.json({ success: true, country })
  } catch (error: any) {
    console.error('[Affiliate Click API] Error:', error.message || error)
    return NextResponse.json({ error: 'Failed to log click', details: error.message }, { status: 500 })
  }
}
