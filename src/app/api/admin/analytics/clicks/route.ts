import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    
    const offset = (page - 1) * limit

    // Fetch clicks with search and pagination using Raw SQL to bypass stale Prisma client
    let query = `
      SELECT c.*, d.image as product_image, 
             COALESCE(u.name, a.name) as user_name, 
             u.image as user_image,
             CASE WHEN a.id IS NOT NULL THEN 'Admin' WHEN u.id IS NOT NULL THEN 'User' ELSE NULL END as user_role
      FROM affiliateclick c
      LEFT JOIN deal d ON c.asin = d.asin
      LEFT JOIN user u ON c.userId = u.id OR c.userId = u.email
      LEFT JOIN admin a ON c.userId = CAST(a.id AS CHAR) OR c.userId = a.email
    `
    const params: any[] = []

    if (search) {
      query += ` WHERE c.asin LIKE ? OR c.title LIKE ? OR c.ip LIKE ? OR c.country LIKE ? `
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern, searchPattern)
    }

    query += ` ORDER BY c.createdAt DESC LIMIT ? OFFSET ? `
    params.push(limit, offset)

    const clicks = await db.$queryRawUnsafe(query, ...params) as any[]

    // Get total count
    let countQuery = `SELECT COUNT(*) as count FROM affiliateclick`
    const countParams: any[] = []
    if (search) {
      countQuery += ` WHERE asin LIKE ? OR title LIKE ? OR ip LIKE ? OR country LIKE ? `
      const searchPattern = `%${search}%`
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern)
    }
    
    const totalResult = await db.$queryRawUnsafe(countQuery, ...countParams) as any[]
    const total = Number(totalResult[0]?.count || 0)

    return NextResponse.json({
      clicks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('[Clicks API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch clicks', details: error.message }, { status: 500 })
  }
}
