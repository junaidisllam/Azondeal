import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/auth'

export async function POST(req: NextRequest) {
  console.log('[Search History API] Received request');
  try {
    const body = await req.json()
    const { query, page } = body
    
    if (!query) {
      console.warn('[Search History API] Missing query in request body');
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const userAgent = req.headers.get('user-agent') || 'unknown'
    const searchPage = page || 'unknown'
    
    // Capture IP Address using NextRequest.ip or headers
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

    // Try to get session but don't let it block
    let userIdentifier: string | null = null
    try {
      const session = await auth()
      userIdentifier = session?.user?.id || session?.user?.email || null
    } catch (authError) {
      console.warn('[Search History API] Auth check failed:', authError);
    }

    // Use raw SQL to bypass Prisma client type sync issues
    await db.$executeRawUnsafe(
      'INSERT INTO searchhistory (query, device, page, ip, userId, createdAt) VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP(3))',
      query.trim(),
      userAgent,
      searchPage,
      ip,
      userIdentifier
    )

    console.log('[Search History API] Record created successfully via Raw SQL');
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Search History API] Error:', error.message || error);
    return NextResponse.json({ 
      error: 'Failed to save search history', 
      details: error.message || 'Unknown error' 
    }, { status: 500 })
  }
}
