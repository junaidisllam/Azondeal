import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import dns from 'dns';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  console.warn('[Similar Deals API] Failed to set DNS result order:', e);
}

const API_KEY = 'AIzaSyA9vnqklMIZmxM4SkD4Io8vbRjgI7mcVW4';
const AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
const KOUPON_RELATED_URL = 'https://www.koupon.ai/api/recommend/related-deal';
const CACHE_DIR = path.join(process.cwd(), 'tmp');
const TOKEN_CACHE_FILE = path.join(CACHE_DIR, 'firebase_token.json');

// Helper function to fetch the Firebase authentication token (caches until expiry)
async function getAuthToken(): Promise<string | null> {
  try {
    // 1. Check if cached token is valid
    if (fs.existsSync(TOKEN_CACHE_FILE)) {
      try {
        const cacheContent = fs.readFileSync(TOKEN_CACHE_FILE, 'utf-8');
        const cacheData = JSON.parse(cacheContent);
        const bufferTimeMs = 60 * 1000; // 1 minute safety buffer
        
        if (cacheData.token && cacheData.expiresAt && Date.now() < cacheData.expiresAt - bufferTimeMs) {
          console.log('[Similar Deals API] Returning cached auth token');
          return cacheData.token;
        }
      } catch (cacheErr) {
        console.warn('[Similar Deals API] Error reading token cache:', cacheErr);
      }
    }

    // 2. Fetch fresh token if no valid cache
    console.log('[Similar Deals API] Fetching fresh Firebase auth token...');
    const res = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        returnSecureToken: true,
      }),
    });

    if (!res.ok) {
      console.error('[Similar Deals API] Firebase authentication failed:', res.status);
      return null;
    }

    const data = await res.json();
    if (!data || !data.idToken) {
      return null;
    }

    const token = `Bearer ${data.idToken}`;
    // Firebase expiresIn is in seconds, convert to millisecond timestamp
    const expiresInSeconds = Number(data.expiresIn || '3600');
    const expiresAt = Date.now() + expiresInSeconds * 1000;

    // 3. Cache the token
    try {
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }
      fs.writeFileSync(
        TOKEN_CACHE_FILE,
        JSON.stringify({ token, expiresAt }, null, 2),
        'utf-8'
      );
      console.log('[Similar Deals API] Successfully cached Firebase auth token');
    } catch (writeErr) {
      console.error('[Similar Deals API] Failed to write token cache:', writeErr);
    }

    return token;
  } catch (err) {
    console.error('[Similar Deals API] Error getting auth token:', err);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('id');
  const size = searchParams.get('limit') || searchParams.get('size') || '30';
  let platform = searchParams.get('platform') || 'amazon';

  if (!productId) {
    return NextResponse.json({ error: 'Product ID (id) is required' }, { status: 400 });
  }

  // Ensure platform is properly capitalized or lowercased if needed (Koupon expects lowercased usually)
  platform = platform.toLowerCase();

  try {
    // 1. Get Firebase auth token
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ deals: [], error: 'Authentication failed to retrieve secure token' });
    }

    // 2. Fetch related deals from Koupon
    const queryParams = new URLSearchParams({
      id: productId,
      size: size,
      platform: platform
    });

    const url = `${KOUPON_RELATED_URL}?${queryParams.toString()}`;
    console.log(`[Similar Deals API] Fetching from Koupon: ${url}`);

    let response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
        'Authorization': token
      }
    });

    // 2.5. Self-healing token refresh on Auth errors (401/403)
    if (response.status === 401 || response.status === 403) {
      console.warn(`[Similar Deals API] Received auth error ${response.status} from Koupon. Invalidating cached token and retrying with fresh token...`);
      try {
        if (fs.existsSync(TOKEN_CACHE_FILE)) {
          fs.unlinkSync(TOKEN_CACHE_FILE);
        }
      } catch (unlinkErr) {
        console.error('[Similar Deals API] Failed to delete expired token file:', unlinkErr);
      }
      
      const freshToken = await getAuthToken();
      if (freshToken) {
        response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
            'Authorization': freshToken
          }
        });
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[Similar Deals API] Koupon returned error ${response.status}:`, errorText);
      return NextResponse.json({ deals: [] });
    }

    const rawData = await response.json();
    // Koupon returns deals inside rawData.data.deals
    const rawDeals = Array.isArray(rawData) 
      ? rawData 
      : (rawData.data?.deals || rawData.deals || rawData.data || []);

    // 3. Map Koupon's related deal structure to match expected frontend schema
    const formattedDeals = rawDeals.map((item: any, index: number) => {
      const cleanImageUrl = typeof item.imgUrl === 'string'
        ? item.imgUrl
        : (typeof item.image === 'string' ? item.image : (item.image?.url || ''));

      return {
        ...item,
        asin: item.id || `sim-${index}`,
        deal_hash: item.id || `sim-${index}`,
        title: item.title || '',
        image: cleanImageUrl,
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
      };
    });

    return NextResponse.json(formattedDeals);

  } catch (error: any) {
    console.error('[Similar Deals API] Error:', error);
    return NextResponse.json({ deals: [], error: error.message });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const productId = body.id || body.asin;
    const size = body.limit || body.size || '30';
    const platform = body.platform || 'amazon';

    if (!productId) {
      return NextResponse.json({ error: 'Product ID (id) is required in body' }, { status: 400 });
    }

    // Forward to the GET handler logic
    const reqUrl = new URL(request.url);
    reqUrl.searchParams.set('id', productId);
    reqUrl.searchParams.set('size', String(size));
    reqUrl.searchParams.set('platform', platform);
    
    const mockRequest = new Request(reqUrl.toString(), {
      method: 'GET',
      headers: request.headers
    });
    
    return GET(mockRequest);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
