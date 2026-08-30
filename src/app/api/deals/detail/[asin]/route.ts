import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import dns from 'dns';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  console.warn('[Deal Detail API] Failed to set DNS result order:', e);
}

const CACHE_DIR = path.join(process.cwd(), 'tmp');
const CACHE_FILE = path.join(CACHE_DIR, 'build_id.json');
const BUILD_ID_API_URL = 'https://api.activevoucher.com/get_build_id.php';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
  'Accept': 'application/json'
};

// Helper function to get cached Build ID or fetch a default
function getCachedBuildIdData(): { buildId: string; timestamp: number } {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const cacheContent = fs.readFileSync(CACHE_FILE, 'utf-8');
      const cacheData = JSON.parse(cacheContent);
      if (cacheData.buildId && cacheData.timestamp) {
        return { buildId: cacheData.buildId, timestamp: cacheData.timestamp };
      }
    }
  } catch (err) {
    console.error('[Deal Detail API] Error reading cache file:', err);
  }
  return { buildId: 'dkEmxjhggferMfQvL3A6p', timestamp: 0 }; // Fallback default
}

// Helper function to get cached Build ID (backwards compatibility)
function getCachedBuildId(): string {
  return getCachedBuildIdData().buildId;
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
    console.error('[Deal Detail API] Error saving build ID to cache:', err);
  }
}

// Helper to fetch live build ID from Koupon.ai HTML
async function fetchLiveBuildId(): Promise<string | null> {
  try {
    console.log('[Deal Detail API] Fetching live build ID from Koupon.ai homepage...');
    const res = await fetch('https://www.koupon.ai/', {
      headers,
      cache: 'no-store'
    });
    if (!res.ok) return null;
    
    const html = await res.text();
    const match = html.match(/"buildId":"([^"]+)"/);
    if (match && match[1]) {
      const newBuildId = match[1];
      console.log('[Deal Detail API] Found live build ID:', newBuildId);
      saveBuildId(newBuildId);
      return newBuildId;
    }
  } catch (err) {
    console.error('[Deal Detail API] Error fetching live build ID from Koupon:', err);
  }
  return null;
}

async function fetchNextJson(productId: string, buildId: string, platformParam?: string) {
  const decodedId = decodeURIComponent(productId);
  
  let platform = 'p'; // Default maps to Amazon
  const normPlat = platformParam?.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normPlat === 'ebay') {
    platform = 'ebay';
  } else if (normPlat === 'walmart') {
    platform = 'walmart';
  } else if (normPlat === 'bestbuy' || normPlat === 'best_buy') {
    platform = 'bestbuy';
  } else if (normPlat === 'macys') {
    platform = 'macys';
  } else if (normPlat === 'newegg') {
    platform = 'newegg';
  } else if (normPlat === 'woot') {
    platform = 'woot';
  } else if (normPlat === 'amazon') {
    platform = 'p';
  } else {
    // Auto-detect fallback
    if (decodedId.includes('v1|')) {
      platform = 'ebay';
    } else if (/^\d+$/.test(decodedId)) {
      platform = 'walmart';
    }
  }

  const url = `https://www.koupon.ai/_next/data/${encodeURIComponent(buildId)}/product/${platform}/${encodeURIComponent(decodedId)}.json`;
  console.log(`[Deal Detail API] Requesting product detail for platform [${platform}]: ${url}`);
  
  const response = await fetch(url, {
    headers,
    cache: 'no-store'
  });
  
  return response;
}

function formatMerchantName(platformName: string): string {
  const p = platformName.toLowerCase();
  if (p === 'ebay') return 'eBay';
  if (p === 'walmart') return 'Walmart';
  if (p === 'bestbuy') return 'Best Buy';
  if (p === 'macys') return 'Macy\'s';
  if (p === 'newegg') return 'Newegg';
  if (p === 'woot') return 'Woot';
  if (p === 'amazon' || p === 'p') return 'Amazon';
  return platformName.charAt(0).toUpperCase() + platformName.slice(1);
}

const DETAIL_CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export async function GET(
  request: Request,
  { params }: { params: Promise<{ asin: string }> }
) {
  try {
    const resolvedParams = await params;
    const asin = resolvedParams.asin;

    if (!asin) {
      return NextResponse.json({ error: 'ASIN is required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('force') === 'true';
    const platform = searchParams.get('platform') || '';
    const sanitizedAsin = asin.replace(/[^a-zA-Z0-9-_]/g, '_');
    const detailCacheFile = path.join(CACHE_DIR, `detail_${sanitizedAsin}.json`);

    // 1. Check if the 24-hour cache is available and valid
    if (!forceRefresh && fs.existsSync(detailCacheFile)) {
      try {
        const cacheContent = fs.readFileSync(detailCacheFile, 'utf-8');
        const cacheData = JSON.parse(cacheContent);
        const age = Date.now() - cacheData.timestamp;

        if (age < DETAIL_CACHE_DURATION_MS && cacheData.deal) {
          console.log(`[Deal Detail API] Returning 24h cached detail for ASIN: ${asin}`);
          return NextResponse.json(cacheData.deal);
        }
      } catch (cacheError) {
        console.error('[Deal Detail API] Error reading product detail cache:', cacheError);
      }
    }

    // 1.5. Check if deal is already stored in local trending caches for instant rendering
    if (!forceRefresh) {
      try {
        if (fs.existsSync(CACHE_DIR)) {
          const files = fs.readdirSync(CACHE_DIR);
          const trendingFiles = files.filter(f => f.startsWith('trending_') && f.endsWith('.json'));
          
          for (const file of trendingFiles) {
            const filePath = path.join(CACHE_DIR, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(content);
            const rawDeals = Array.isArray(data) ? data : (data.deals || []);
            
            const matchedDeal = rawDeals.find((d: any) => d.asin === asin || d.id === asin || d.deal_hash === asin);
            if (matchedDeal) {
              console.log(`[Deal Detail API] Instantly found deal in local trending cache: ${file}`);
              
              // Map to full detail format cleanly
              const mappedDeal = {
                id: matchedDeal.asin || asin,
                asin: matchedDeal.asin || asin,
                deal_hash: matchedDeal.deal_hash || matchedDeal.asin || asin,
                title: matchedDeal.title || '',
                image: matchedDeal.image || matchedDeal.imgUrl || '',
                image_ids: matchedDeal.image_ids || [matchedDeal.image || matchedDeal.imgUrl || ''],
                price: matchedDeal.list_price || matchedDeal.price || 0,
                discounted_price: matchedDeal.discounted_price || matchedDeal.price || 0,
                discount_percentage: matchedDeal.discount_percentage || matchedDeal.discount || 0,
                avg_rating: matchedDeal.rating || 4.5,
                ratings_count: matchedDeal.ratings_count || matchedDeal.ratingsTotal || 0,
                category: matchedDeal.category || 'Deals',
                merchant_name: matchedDeal.merchant_name || matchedDeal.platform || 'Amazon',
                promo_string: matchedDeal.promo_string || '',
                has_coupon: !!matchedDeal.promo_code,
                coupon_value: matchedDeal.promo_code || '',
                promo_code: matchedDeal.promo_code || '',
                codes: matchedDeal.codes || (matchedDeal.promo_code ? [matchedDeal.promo_code] : []),
                variants: matchedDeal.variants || [],
                aiExpert: null,
                seoData: null
              };
              
              return NextResponse.json(mappedDeal);
            }
          }
        }
      } catch (err) {
        console.error('[Deal Detail API] Error scanning trending cache files:', err);
      }
    }

    const { buildId, timestamp } = getCachedBuildIdData();
    let response = await fetchNextJson(asin, buildId, platform);

    // If 404, build ID is invalid/expired. Retrieve the latest build ID.
    if (response.status === 404) {
      const buildIdAge = Date.now() - timestamp;
      // If buildId is less than 10 minutes old, the buildId is definitely fresh, so the product simply doesn't exist.
      if (buildIdAge < 10 * 60 * 1000) {
        console.warn(`[Deal Detail API] Received 404 for ASIN ${asin} with fresh build ID ${buildId} (cache age: ${Math.round(buildIdAge / 1000)}s). Product is likely non-existent. Skipping build ID refresh.`);
      } else {
        console.warn(`[Deal Detail API] Received 404 with build ID ${buildId}. Fetching fresh build ID from ActiveVoucher...`);
        let newBuildId: string | null = null;

        // 1. Try fetching from ActiveVoucher API first (extremely fast, no Cloudflare blocks)
        try {
          const avRes = await fetch(BUILD_ID_API_URL, { cache: 'no-store' });
          const avData = await avRes.json();
          if (avData?.status === 'success' && avData?.buildId) {
            newBuildId = avData.buildId;
            console.log('[Deal Detail API] Successfully fetched build ID from ActiveVoucher:', newBuildId);
          }
        } catch (avErr) {
          console.error('[Deal Detail API] ActiveVoucher build ID fetch failed, trying Koupon scraping...', avErr);
        }

        // 2. Fallback to Koupon scraping only if ActiveVoucher API failed
        if (!newBuildId) {
          newBuildId = await fetchLiveBuildId();
        }
        
        if (newBuildId) {
          response = await fetchNextJson(asin, newBuildId, platform);
        }
      }
    }

    if (!response.ok) {
      // Fallback to expired cache if available during upstream error
      if (fs.existsSync(detailCacheFile)) {
        try {
          const cacheContent = fs.readFileSync(detailCacheFile, 'utf-8');
          const cacheData = JSON.parse(cacheContent);
          if (cacheData.deal) {
            console.warn('[Deal Detail API] Upstream error. Returning expired cached detail as fallback.');
            return NextResponse.json(cacheData.deal);
          }
        } catch (_) {}
      }

      return NextResponse.json({
        success: false,
        error: `Failed to fetch product details from provider. HTTP status: ${response.status}`
      }, { status: response.status });
    }

    const nextData = await response.json();
    const pageProps = nextData?.pageProps;

    if (!pageProps) {
      return NextResponse.json({
        success: false,
        error: 'Unexpected response structure from product detail source'
      }, { status: 500 });
    }

    const product = pageProps.deal || pageProps.product || {};
    
    // Koupon product images are array of objects: [{ key: 0, url: "..." }]. Extract clean string URLs.
    const rawImages = product.images || [];
    const imageIds: string[] = Array.isArray(rawImages)
      ? rawImages.map((img: any) => typeof img === 'string' ? img : (img.url || ''))
      : [];

    const mainImageUrl = typeof product.imgUrl === 'string'
      ? product.imgUrl
      : (product.mainImage || product.image?.url || (imageIds && imageIds[0]) || '');

    const finalImageIds = imageIds.length > 0 ? imageIds : [mainImageUrl];

    // Map Koupon product detail object to match what ProductDetailContent.tsx expects in the UI
    const mappedDeal = {
      id: product.id || asin,
      asin: product.id || asin,
      deal_hash: product.id || asin,
      title: product.title || '',
      image: mainImageUrl,
      image_ids: finalImageIds,
      price: product.comparedPrice || product.price || 0,
      discounted_price: product.price || 0,
      discount_percentage: product.discount || 0,
      avg_rating: product.rating || 4.5,
      ratings_count: product.ratingsTotal || 0,
      category: product.categories && product.categories[0] ? product.categories[0].name : 'Deals',
      merchant_name: product.platform
        ? formatMerchantName(product.platform)
        : (platform ? formatMerchantName(platform) : (asin.includes('v1|') ? 'eBay' : (/^\d+$/.test(asin) ? 'Walmart' : 'Amazon'))),
      merchant_id: product.merchantId || product.merchant_id || product.sellerId || product.shopId || (product.productLink ? (product.productLink.match(/[?&]m=([^&]+)/)?.[1] || '') : '') || '',
      code_id: product.promocodeId || '',
      promo_string: product.highlights || '',
      has_coupon: !!product.code,
      coupon_value: product.code || '',
      promo_code: product.code || '',
      codes: product.code ? [product.code] : [],
      variants: (product.variants || []).map((v: any, index: number) => ({
        asin: v.id || `variant-${index}`,
        deal_hash: v.id || `variant-${index}`,
        title: v.title || product.title,
        image: typeof v.imgUrl === 'string' ? v.imgUrl : (v.image?.url || mainImageUrl),
        price: v.comparedPrice || v.price || 0,
        discounted_price: v.price || 0,
        discount_percentage: v.discount || 0
      })),
      aiExpert: pageProps.aiExpert || null,
      seoData: pageProps.seoData || null
    };

    // Save to 24-hour cache
    try {
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }
      fs.writeFileSync(
        detailCacheFile,
        JSON.stringify({ timestamp: Date.now(), deal: mappedDeal }, null, 2),
        'utf-8'
      );
      console.log(`[Deal Detail API] Successfully cached product detail for 24 hours: ${asin}`);
    } catch (cacheWriteErr) {
      console.error('[Deal Detail API] Failed to write product detail cache:', cacheWriteErr);
    }

    return NextResponse.json(mappedDeal);

  } catch (error: any) {
    console.error('[Deal Detail API] Critical error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || String(error)
    }, { status: 500 });
  }
}
