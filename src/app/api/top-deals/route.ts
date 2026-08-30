import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import dns from 'dns';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  console.warn('[Top Deals API] Failed to set DNS result order:', e);
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
    console.error('[Top Deals API] Error reading cache file:', err);
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
    console.error('[Top Deals API] Error saving build ID to cache:', err);
  }
}

// Helper to fetch live build ID from Koupon.ai HTML
async function fetchLiveBuildId(): Promise<string | null> {
  try {
    const res = await fetch('https://www.koupon.ai/', {
      headers,
      cache: 'no-store'
    });
    if (!res.ok) return null;
    
    const html = await res.text();
    const match = html.match(/"buildId":"([^"]+)"/);
    if (match && match[1]) {
      const newBuildId = match[1];
      saveBuildId(newBuildId);
      return newBuildId;
    }
  } catch (err) {
    console.error('[Top Deals API] Error fetching live build ID:', err);
  }
  return null;
}

async function fetchTrendingJson(rankingName: string, buildId: string) {
  const url = `https://www.koupon.ai/_next/data/${encodeURIComponent(buildId)}/trending/${encodeURIComponent(rankingName)}.json`;
  return await fetch(url, { headers, cache: 'no-store' });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '25', 10);

  const rankingName = 'top-trending';
  const cacheFile = path.join(CACHE_DIR, 'trending_top-trending.json');

  try {
    let deals: any[] = [];

    // 1. Try to read from 24h cache first
    let cacheValid = false;
    if (fs.existsSync(cacheFile)) {
      try {
        const cacheContent = fs.readFileSync(cacheFile, 'utf-8');
        const cacheData = JSON.parse(cacheContent);
        const age = Date.now() - cacheData.timestamp;
        const oneDay = 24 * 60 * 60 * 1000;
        
        if (age < oneDay && Array.isArray(cacheData.deals)) {
          deals = cacheData.deals;
          cacheValid = true;
        }
      } catch (_) {}
    }

    if (!cacheValid) {
      let buildId = getCachedBuildId();
      let response = await fetchTrendingJson(rankingName, buildId);

      if (response.status === 404) {
        let newBuildId: string | null = null;
        try {
          const avRes = await fetch(BUILD_ID_API_URL, { cache: 'no-store' });
          const avData = await avRes.json();
          if (avData?.status === 'success' && avData?.buildId) {
            newBuildId = avData.buildId;
          }
        } catch (_) {}

        if (!newBuildId) {
          newBuildId = await fetchLiveBuildId();
        }

        if (newBuildId) {
          buildId = newBuildId;
          saveBuildId(buildId);
          response = await fetchTrendingJson(rankingName, buildId);
        }
      }

      if (response.ok) {
        const data = await response.json();
        const rawDeals = data?.pageProps?.deals;

        if (rawDeals && Array.isArray(rawDeals)) {
          deals = rawDeals.map((item: any, index: number) => ({
            asin: item.id || `today-${index}`,
            deal_hash: item.id || `today-${index}`,
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

          // Cache it
          try {
            if (!fs.existsSync(CACHE_DIR)) {
              fs.mkdirSync(CACHE_DIR, { recursive: true });
            }
            fs.writeFileSync(
              cacheFile,
              JSON.stringify({ timestamp: Date.now(), deals }, null, 2),
              'utf-8'
            );
          } catch (_) {}
        }
      } else {
        // Fallback to cache if exists
        if (fs.existsSync(cacheFile)) {
          const cacheContent = fs.readFileSync(cacheFile, 'utf-8');
          const cacheData = JSON.parse(cacheContent);
          if (Array.isArray(cacheData.deals)) {
            deals = cacheData.deals;
          }
        }
      }
    }

    // Paginate sliced deals
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedDeals = deals.slice(startIndex, endIndex);

    return NextResponse.json({
      deals: paginatedDeals,
      totalDeals: deals.length,
      page,
      limit,
      hasNextPage: endIndex < deals.length
    });
  } catch (error: any) {
    console.error('Error fetching top deals:', error);
    return NextResponse.json({ deals: [], error: error.message });
  }
}
