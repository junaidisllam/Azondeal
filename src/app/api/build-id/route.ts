import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), 'tmp');
const CACHE_FILE = path.join(CACHE_DIR, 'build_id.json');
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const SOURCE_URL = 'https://api.activevoucher.com/get_build_id.php';

interface CacheData {
  buildId: string;
  timestamp: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('force') === 'true';

    // 1. Check if cache exists and is valid (less than 7 days old)
    if (!forceRefresh && fs.existsSync(CACHE_FILE)) {
      try {
        const cacheContent = fs.readFileSync(CACHE_FILE, 'utf-8');
        const cacheData: CacheData = JSON.parse(cacheContent);

        const age = Date.now() - cacheData.timestamp;
        if (age < CACHE_DURATION_MS && cacheData.buildId) {
          console.log('[Build ID API] Returning cached build ID:', cacheData.buildId);
          return NextResponse.json({
            status: 'success',
            buildId: cacheData.buildId,
            cached: true,
            expiresAt: new Date(cacheData.timestamp + CACHE_DURATION_MS).toISOString()
          });
        }
      } catch (cacheError) {
        console.error('[Build ID API] Error reading cache file, will fetch fresh:', cacheError);
      }
    }

    // 2. Fetch fresh build ID from the source URL
    console.log('[Build ID API] Fetching fresh build ID from source:', SOURCE_URL);
    const response = await fetch(SOURCE_URL, {
      cache: 'no-store', // Do not let browser/Fetch API cache the upstream response
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch build ID: HTTP status ${response.status}`);
    }

    const data = await response.json();
    if (!data || data.status !== 'success' || !data.buildId) {
      throw new Error(`Invalid response format from build ID source: ${JSON.stringify(data)}`);
    }

    const freshBuildId = data.buildId;

    // 3. Ensure cache directory exists and write new cache
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    const newCacheData: CacheData = {
      buildId: freshBuildId,
      timestamp: Date.now()
    };

    fs.writeFileSync(CACHE_FILE, JSON.stringify(newCacheData, null, 2), 'utf-8');
    console.log('[Build ID API] Successfully fetched and cached build ID:', freshBuildId);

    return NextResponse.json({
      status: 'success',
      buildId: freshBuildId,
      cached: false,
      expiresAt: new Date(newCacheData.timestamp + CACHE_DURATION_MS).toISOString()
    });

  } catch (error: any) {
    console.error('[Build ID API] Error:', error);
    
    // Fallback to cache if exists even if expired
    if (fs.existsSync(CACHE_FILE)) {
      try {
        const cacheContent = fs.readFileSync(CACHE_FILE, 'utf-8');
        const cacheData: CacheData = JSON.parse(cacheContent);
        if (cacheData.buildId) {
          console.log('[Build ID API] Returning expired cached build ID as fallback due to error:', cacheData.buildId);
          return NextResponse.json({
            status: 'success',
            buildId: cacheData.buildId,
            cached: true,
            fallback: true,
            error: error.message || String(error)
          });
        }
      } catch (fallbackError) {
        // ignore
      }
    }

    return NextResponse.json({
      status: 'error',
      message: 'Failed to retrieve build ID',
      details: error.message || String(error)
    }, { status: 500 });
  }
}
