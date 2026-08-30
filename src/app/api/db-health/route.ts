import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const start = Date.now();
    // Attempt a simple query
    await db.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    return NextResponse.json({
      success: true,
      message: 'Database connection successful!',
      latencyMs: latency,
      time: new Date().toISOString()
    });
  } catch (error: any) {
    const dbUrl = process.env.DATABASE_URL || '';
    
    let parsedInfo = {
      host: 'unknown',
      port: 'unknown',
      database: 'unknown',
      username: 'unknown',
    };

    try {
      if (dbUrl) {
        const urlObj = new URL(dbUrl);
        parsedInfo.host = urlObj.hostname;
        parsedInfo.port = urlObj.port;
        parsedInfo.database = urlObj.pathname.substring(1);
        parsedInfo.username = urlObj.username;
      }
    } catch (e) {
      // Ignore URL parse error
    }

    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      errorName: error.name,
      errorMessage: error.message,
      errorCode: error.code,
      meta: error.meta,
      clientVersion: error.clientVersion,
      attemptedConnectionDetails: {
        host: parsedInfo.host,
        port: parsedInfo.port,
        database: parsedInfo.database,
        username: parsedInfo.username,
        hasPassword: dbUrl.includes(':') && dbUrl.includes('@'),
      },
      time: new Date().toISOString()
    }, { status: 500 });
  }
}
