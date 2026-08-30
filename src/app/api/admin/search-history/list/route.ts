import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    
    const offset = (page - 1) * limit

    // Fetch history with user info using Raw SQL
    let query = `
      SELECT h.*, u.name as user_name, u.image as user_image
      FROM searchhistory h
      LEFT JOIN user u ON h.userId = u.id OR h.userId = u.email
    `
    const params: any[] = []

    if (search) {
      query += ` WHERE h.query LIKE ? OR h.ip LIKE ? OR h.userId LIKE ? `
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }

    query += ` ORDER BY h.createdAt DESC LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const [history, totalResult] = await Promise.all([
      db.$queryRawUnsafe(query, ...params),
      db.$queryRawUnsafe(`SELECT COUNT(*) as count FROM searchhistory ${search ? 'WHERE query LIKE ? OR ip LIKE ? OR userId LIKE ?' : ''}`, ...(search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []))
    ])

    const total = Number((totalResult as any)[0]?.count || 0)

    return NextResponse.json({
      history,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching search history:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
