import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import dns from 'dns';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  console.warn('[Today Trending API] Failed to set DNS result order:', e);
}

const CACHE_DIR = path.join(process.cwd(), 'tmp');
const CACHE_FILE = path.join(CACHE_DIR, 'build_id.json');
const BUILD_ID_API_URL = 'https://api.activevoucher.com/get_build_id.php';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
  'Accept': 'application/json'
};

// Helper function to get cached Build ID or fetch a default
function getCachedBuildId(): string {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const cacheContent = fs.readFileSync(CACHE_FILE, 'utf-8');
      const cacheData = JSON.parse(cacheContent);
      if (cacheData.buildId) {
        return cacheData.buildId;
      }
    }
  } catch (err) {
    console.error('[Today Trending API] Error reading cache file:', err);
  }
  return 'dkEmxjhggferMfQvL3A6p'; // Fallback default
}

// Helper to save Build ID to local cache
function saveBuildId(buildId: string) {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(
      CACHE_FILE,
      JSON.stringify({ buildId, timestamp: Date.now() }, null, 2),
      'utf-8'
    );
  } catch (err) {
    console.error('[Today Trending API] Error saving build ID to cache:', err);
  }
}

// Helper to fetch live build ID from Koupon.ai HTML
async function fetchLiveBuildId(): Promise<string | null> {
  try {
    console.log('[Today Trending API] Fetching live build ID from Koupon.ai homepage...');
    const res = await fetch('https://www.koupon.ai/', {
      headers,
      cache: 'no-store'
    });
    if (!res.ok) return null;
    
    const html = await res.text();
    const match = html.match(/"buildId":"([^"]+)"/);
    if (match && match[1]) {
      const newBuildId = match[1];
      console.log('[Today Trending API] Found live build ID:', newBuildId);
      saveBuildId(newBuildId);
      return newBuildId;
    }
  } catch (err) {
    console.error('[Today Trending API] Error fetching live build ID from Koupon:', err);
  }
  return null;
}

async function fetchTrendingJson(rankingName: string, buildId: string) {
  const url = `https://www.koupon.ai/_next/data/${encodeURIComponent(buildId)}/trending/${encodeURIComponent(rankingName)}.json`;
  console.log(`[Today Trending API] Requesting: ${url}`);
  
  const response = await fetch(url, {
    headers,
    cache: 'no-store'
  });
  
  return response;
}

const DATA_CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rankingName = searchParams.get('ranking') || 'top-trending';
    const forceRefresh = searchParams.get('force') === 'true';

    const rankingCacheFile = path.join(CACHE_DIR, `trending_${rankingName}.json`);

    // 1. Check if the 24-hour cache is available and valid
    if (!forceRefresh && fs.existsSync(rankingCacheFile)) {
      try {
        const cacheContent = fs.readFileSync(rankingCacheFile, 'utf-8');
        const cacheData = JSON.parse(cacheContent);
        const age = Date.now() - cacheData.timestamp;

        if (age < DATA_CACHE_DURATION_MS && Array.isArray(cacheData.deals)) {
          console.log(`[Today Trending API] Returning 24h cached deals for: ${rankingName}`);
          return NextResponse.json(cacheData.deals);
        }
      } catch (cacheError) {
        console.error('[Today Trending API] Error reading data cache file, fetching fresh:', cacheError);
      }
    }

    let buildId = getCachedBuildId();
    let response = await fetchTrendingJson(rankingName, buildId);

    // If 404, build ID is invalid/expired. Retrieve the latest build ID.
    if (response.status === 404) {
      console.warn(`[Today Trending API] Received 404 with build ID ${buildId}. Fetching fresh build ID from ActiveVoucher...`);
      let newBuildId: string | null = null;

      // 1. Try fetching from ActiveVoucher API first (extremely fast, no Cloudflare blocks)
      try {
        const avRes = await fetch(BUILD_ID_API_URL, { cache: 'no-store' });
        const avData = await avRes.json();
        if (avData?.status === 'success' && avData?.buildId) {
          newBuildId = avData.buildId;
          console.log('[Today Trending API] Successfully fetched build ID from ActiveVoucher:', newBuildId);
        }
      } catch (avErr) {
        console.error('[Today Trending API] ActiveVoucher build ID fetch failed, trying Koupon scraping...', avErr);
      }

      // 2. Fallback to Koupon scraping only if ActiveVoucher API failed
      if (!newBuildId) {
        newBuildId = await fetchLiveBuildId();
      }
      
      if (newBuildId) {
        buildId = newBuildId;
        saveBuildId(buildId);
        response = await fetchTrendingJson(rankingName, buildId);
      }
    }

    if (!response.ok) {
      // Fallback to expired cache if available during upstream error
      if (fs.existsSync(rankingCacheFile)) {
        try {
          const cacheContent = fs.readFileSync(rankingCacheFile, 'utf-8');
          const cacheData = JSON.parse(cacheContent);
          if (Array.isArray(cacheData.deals)) {
            console.warn('[Today Trending API] Upstream error. Returning expired cached deals as fallback.');
            return NextResponse.json(cacheData.deals);
          }
        } catch (_) {}
      }

      return NextResponse.json({
        success: false,
        error: `Failed to fetch trending deals from provider. HTTP status: ${response.status}`
      }, { status: response.status });
    }

    const data = await response.json();
    const deals = data?.pageProps?.deals;

    if (!deals) {
      return NextResponse.json({
        success: false,
        error: 'Unexpected response structure from trending data source'
      }, { status: 500 });
    }

    // Map Koupon.ai data structure to match what formatDeal / DealSlider expects in the UI
    const formattedDeals = deals.map((item: any, index: number) => ({
      ...item,
      asin: item.id || `deal-${index}`,
      deal_hash: item.id || `deal-${index}`,
      title: item.title || '',
      image: item.imgUrl || item.image || '',
      discount_percentage: item.discount || 0,
      discounted_price: item.price || 0,
      list_price: item.comparedPrice || item.price || 0,
      promo_code: item.code || '',
      codes: item.code ? [item.code] : [],
      has_promo_code: !!item.code,
      rating: item.rating || 4.5,
      ratings_count: item.ratingsTotal || 0,
      bought_past_month: item.monthlySold || 0,
      merchant_name: item.platform ? (item.platform.charAt(0).toUpperCase() + item.platform.slice(1)) : 'Amazon',
    }));

    // Save to 24-hour cache
    try {
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }
      fs.writeFileSync(
        rankingCacheFile,
        JSON.stringify({ timestamp: Date.now(), deals: formattedDeals }, null, 2),
        'utf-8'
      );
      console.log(`[Today Trending API] Successfully cached deals for 24 hours: ${rankingName}`);
    } catch (cacheWriteErr) {
      console.error('[Today Trending API] Failed to write data cache:', cacheWriteErr);
    }

    // Return the mapped array of deals
    return NextResponse.json(formattedDeals);

  } catch (error: any) {
    console.error('[Today Trending API] Critical error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || String(error)
    }, { status: 500 });
  }
}
