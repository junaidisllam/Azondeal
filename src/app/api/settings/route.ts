import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isDbConfigured } from '@/lib/db-config'

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'System not configured' }, { status: 503 })
  }
  try {
    const keys = [
      'amazon_affiliate_id',
      'ebay_affiliate_id',
      'walmart_affiliate_id',
      'bestbuy_affiliate_id',
      'macys_affiliate_id',
      'newegg_affiliate_id',
      'woot_affiliate_id'
    ]
    const placeholders = keys.map(() => '?').join(', ')
    const settings = await db.$queryRawUnsafe(
      `SELECT \`key\`, \`value\` FROM setting WHERE \`key\` IN (${placeholders})`,
      ...keys
    ) as any[]
    
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value
      return acc
    }, {} as Record<string, string>)

    // Ensure all keys exist in the response map
    keys.forEach(k => {
      if (!settingsMap[k]) settingsMap[k] = '';
    });

    return NextResponse.json(settingsMap)
  } catch (error: any) {
    console.error('[Public Settings API] GET Error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch settings',
      message: error.message 
    }, { status: 500 })
  }
}
