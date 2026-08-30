import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Fetch real-time stats from database
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)
    
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // Fetch real-time stats from database
    const [
      totalCategories,
      totalUsers,
      totalClicks,
      activityToday,
      activityYesterday,
      activityMonth,
      activityLastMonth
    ] = await Promise.all([
      db.category.count(),
      db.user.count(),
      db.affiliateclick.count(),
      db.affiliateclick.count({ where: { createdAt: { gte: todayStart } } }),
      db.affiliateclick.count({ where: { createdAt: { gte: yesterdayStart, lt: todayStart } } }),
      db.affiliateclick.count({ where: { createdAt: { gte: thisMonthStart } } }),
      db.affiliateclick.count({ where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
    ])

    // Live Traffic (sessions updated in the last 2 minutes)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000)
    
    // Fetch all active records to group them by visitor
    const activeRecords: any[] = await db.$queryRawUnsafe(`
      SELECT t.visitorId, t.userId, t.sessionId, t.path, t.ip, t.device, t.countryCode, t.updatedAt, u.name as userName
      FROM realtimetraffic t
      LEFT JOIN user u ON t.userId = u.id
      WHERE t.updatedAt >= ?
      ORDER BY t.updatedAt DESC
    `, twoMinutesAgo)

    // Grouping logic
    const visitorMap = new Map<string, any>()
    activeRecords.forEach(record => {
      const vid = record.visitorId || `anon_${record.sessionId}`
      if (!visitorMap.has(vid)) {
        visitorMap.set(vid, {
          visitorId: vid,
          userId: record.userId,
          userName: record.userName,
          countryCode: record.countryCode,
          ip: record.ip,
          device: record.device,
          updatedAt: record.updatedAt,
          pages: []
        })
      }
      const visitor = visitorMap.get(vid)
      if (record.path && !visitor.pages.includes(record.path)) {
        visitor.pages.push(record.path)
      }
      // Update with more data if available (e.g. if one tab has userId and another doesn't)
      if (record.userId && !visitor.userId) {
        visitor.userId = record.userId
        visitor.userName = record.userName
      }
      // Keep the most recent timestamp
      if (record.updatedAt > visitor.updatedAt) {
        visitor.updatedAt = record.updatedAt
      }
    })

    const visitorsList = Array.from(visitorMap.values())

    // Async cleanup of old sessions (older than 5 mins) to keep DB light
    db.realtimetraffic.deleteMany({
      where: { updatedAt: { lt: new Date(Date.now() - 5 * 60 * 1000) } }
    }).catch(e => console.error('Cleanup error', e))

    return NextResponse.json({
      totalCategories,
      totalUsers,
      totalClicks,
      activity: {
        today: activityToday,
        yesterday: activityYesterday,
        month: activityMonth,
        lastMonth: activityLastMonth
      },
      live: {
        count: visitorsList.length,
        visitors: visitorsList
      }
    })
  } catch (error: any) {
    console.error('Dashboard Stats Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
