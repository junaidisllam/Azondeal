import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { headers } from 'next/headers'
import { isDbConfigured } from '@/lib/db-config'

export async function POST(req: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'System not configured' }, { status: 503 })
  }
  try {
    const { sessionId, visitorId, userId, path, disconnect } = await req.json()
    if (!sessionId) return NextResponse.json({ error: 'Session ID required' }, { status: 400 })

    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for') || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'
    
    let countryCode = headersList.get('cf-ipcountry') || 
                        headersList.get('x-vercel-ip-country') || 
                        'unknown'

    // Detect localhost
    if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.')) {
      countryCode = 'local'
    }

    // If disconnect is requested, remove the specific session/tab immediately
    if (disconnect) {
      await db.$executeRaw`DELETE FROM realtimetraffic WHERE sessionId = ${sessionId}`
      return NextResponse.json({ success: true, message: 'Disconnected' })
    }

    // Use safe $executeRaw with template literals
    await db.$executeRaw`
      INSERT INTO realtimetraffic (sessionId, visitorId, userId, path, ip, device, countryCode, updatedAt)
      VALUES (${sessionId}, ${visitorId}, ${userId}, ${path}, ${ip}, ${userAgent}, ${countryCode}, UTC_TIMESTAMP())
      ON DUPLICATE KEY UPDATE 
        path = VALUES(path),
        visitorId = VALUES(visitorId),
        userId = VALUES(userId),
        updatedAt = UTC_TIMESTAMP(),
        ip = VALUES(ip),
        countryCode = VALUES(countryCode)
    `

    // Periodic cleanup of stale sessions (older than 5 minutes)
    // Run cleanup with 10% chance to avoid overhead on every request
    if (Math.random() < 0.1) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      await db.$executeRaw`DELETE FROM realtimetraffic WHERE updatedAt < ${fiveMinutesAgo}`
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    // Log detailed error for debugging connection issues
    console.error('Heartbeat Error Details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json({ success: false, error: 'Database heartbeat failed' }, { status: 500 })
  }
}

export async function GET() {
    // This could return the counts, but we'll use dashboard stats for that
    return NextResponse.json({ message: "Use POST to send heartbeat" })
}
