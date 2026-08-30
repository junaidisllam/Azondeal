import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/db'

export async function GET() {
  try {
    // Use raw SQL for maximum reliability
    const settings = await db.$queryRawUnsafe('SELECT `key`, `value` FROM setting') as any[]
    
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value
      return acc
    }, {} as Record<string, string>)

    return NextResponse.json(settingsMap)
  } catch (error: any) {
    console.error('[Settings API] GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings', details: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Support batch saving
    if (body.settings && typeof body.settings === 'object') {
      const entries = Object.entries(body.settings)
      for (const [key, value] of entries) {
        if (typeof value === 'string') {
          await db.$executeRawUnsafe(
            'INSERT INTO setting (`key`, `value`, updatedAt) VALUES (?, ?, UTC_TIMESTAMP(3)) ON DUPLICATE KEY UPDATE `value` = ?, updatedAt = UTC_TIMESTAMP(3)',
            key,
            value,
            value
          )
        }
      }
      return NextResponse.json({ success: true, settings: body.settings })
    }

    const { key, value } = body
    
    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    // MariaDB/MySQL Upsert
    await db.$executeRawUnsafe(
      'INSERT INTO setting (`key`, `value`, updatedAt) VALUES (?, ?, UTC_TIMESTAMP(3)) ON DUPLICATE KEY UPDATE `value` = ?, updatedAt = UTC_TIMESTAMP(3)',
      key,
      value,
      value
    )

    return NextResponse.json({ success: true, key, value })
  } catch (error: any) {
    console.error('[Settings API] POST Error:', error)
    return NextResponse.json({ 
      error: 'Failed to update setting', 
      details: error.message || String(error)
    }, { status: 500 })
  }
}
