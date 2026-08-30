import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dns from 'dns';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  console.warn('[Search API] Failed to set DNS result order:', e);
}

const API_KEY = 'AIzaSyA9vnqklMIZmxM4SkD4Io8vbRjgI7mcVW4';
const AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
const REFRESH_TOKEN_URL = `https://securetoken.googleapis.com/v1/token?key=${API_KEY}`;
const KOUPON_SEARCH_URL = 'https://www.koupon.ai/api/search/v1';

const CACHE_DIR = path.join(process.cwd(), 'tmp');
const ID_TOKEN_CACHE_DIR = path.join(CACHE_DIR, 'id_tokens');

const CATEGORY_MAP: Record<string, string> = {
  'home': '1055398',
  'home & kitchen': '1055398',
  'fashion': '1036592',
  'clothing': '1036592',
  'clothing, shoes & jewelry': '1036592',
  'fashion & clothing': '1036592',
  'tech': '502394',
  'electronics': '502394',
  'tech & electronics': '502394',
  'beauty & personal care': '3760911',
  'beauty': '3760911',
  'beauty & care': '3760911',
  'tools & home improvements': '228013',
  'tools': '228013',
  'tools & home improvement': '228013',
  'toys & games': '165793',
  'toys': '165793',
  'patio & garden': '2972638011',
  'patio, lawn & garden': '2972638011',
  'patio': '2972638011',
  'garden': '2972638011',
  'baby & products': '165796',
  'baby products': '165796',
  'baby': '165796',
  'health & household': '3760901',
  'health': '3760901',
  'health & wellness': '3760901',
  'food & grocery': '16310101',
  'food': '16310101',
  'grocery': '16310101',
  'sports & outdoors': '3375251',
  'sports': '3375251',
  'automotive': '15684181',
  'pets supplies': '2619533011',
  'pet supplies': '2619533011',
  'pet': '2619533011',
  'pets': '2619533011',
  'office products': '1064954',
  'office': '1064954',
};

interface AuthCredentials {
  userToken: string;
  authorization: string;
  refreshToken: string;
  expiresAt: number;
}

// Read cached ID Token
function getCachedIdToken(localId: string): string | null {
  const tokenFile = path.join(ID_TOKEN_CACHE_DIR, `${localId}.json`);
  if (fs.existsSync(tokenFile)) {
    try {
      const content = fs.readFileSync(tokenFile, 'utf-8');
      const cacheData = JSON.parse(content);
      const safetyBufferMs = 5 * 60 * 1000;
      if (cacheData.idToken && cacheData.expiresAt && Date.now() < cacheData.expiresAt - safetyBufferMs) {
        return cacheData.idToken;
      }
    } catch (_) {}
  }
  return null;
}

// Write to cache
function cacheIdToken(localId: string, idToken: string, expiresInSeconds: number) {
  try {
    if (!fs.existsSync(ID_TOKEN_CACHE_DIR)) {
      fs.mkdirSync(ID_TOKEN_CACHE_DIR, { recursive: true });
    }
    const tokenFile = path.join(ID_TOKEN_CACHE_DIR, `${localId}.json`);
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    fs.writeFileSync(tokenFile, JSON.stringify({ idToken, expiresAt }), 'utf-8');
  } catch (err) {
    console.error('[Search API] Failed to cache ID token:', err);
  }
}

// Refresh dynamic Firebase token
async function refreshIdToken(refreshToken: string, localId: string): Promise<{ idToken: string; newRefreshToken: string } | null> {
  try {
    const res = await fetch(REFRESH_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    if (!res.ok) {
      console.error('[Search API] Refreshing token failed:', res.status);
      return null;
    }

    const data = await res.json();
    if (!data || !data.id_token) {
      return null;
    }

    const idToken = `Bearer ${data.id_token}`;
    const newRefreshToken = data.refresh_token || refreshToken;
    const expiresInSeconds = Number(data.expires_in || '3600');

    cacheIdToken(localId, idToken, expiresInSeconds);

    return { idToken, newRefreshToken };
  } catch (err) {
    console.error('[Search API] Error in refreshIdToken:', err);
    return null;
  }
}

// Fallback dynamic Firebase anonymous signup
async function performAnonymousSignup(): Promise<{ userToken: string; idToken: string; refreshToken: string; expiresInSeconds: number } | null> {
  try {
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
      console.error('[Search API] Anonymous signup failed:', res.status);
      return null;
    }

    const data = await res.json();
    if (!data || !data.idToken || !data.localId) {
      return null;
    }

    return {
      userToken: data.localId,
      idToken: `Bearer ${data.idToken}`,
      refreshToken: data.refreshToken,
      expiresInSeconds: Number(data.expiresIn || '3600')
    };
  } catch (err) {
    console.error('[Search API] Error in performAnonymousSignup:', err);
    return null;
  }
}

export async function GET(request: Request) {
  let userToken: string | null = null;
  let refreshToken: string | null = null;
  let sessionId: string | null = null;
  let idToken: string | null = null;

  let needToSetCookies = false;
  let refreshedCookies = false;

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || searchParams.get('keyword') || '';
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';
    const categoryName = searchParams.get('category') || '';
    const sortBy = searchParams.get('sortBy') || 'recommended';
    const hasPromoCode = searchParams.get('hasPromoCode') === 'true';
    const hasPriceDrop = searchParams.get('hasPriceDrop') === 'true';

    // Support multi-select platforms/stores
    const platforms = searchParams.getAll('plt[]').length > 0 
      ? searchParams.getAll('plt[]') 
      : (searchParams.get('plt') ? [searchParams.get('plt') as string] : []);
      
    // Support multi-select discount ranges (values: '1', '2', '3')
    const discounts = searchParams.getAll('discount[]').length > 0
      ? searchParams.getAll('discount[]')
      : (searchParams.get('discount') ? [searchParams.get('discount') as string] : []);

    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';

    // 1. Get Firebase Anonymous Auth Session from Browser Cookies
    const cookieStore = await cookies();
    userToken = cookieStore.get('suggest_user_token')?.value || null;
    refreshToken = cookieStore.get('suggest_refresh_token')?.value || null;
    sessionId = cookieStore.get('suggest_session_id')?.value || null;

    // 2. Refresh or retrieve ID Token
    if (userToken && refreshToken && sessionId) {
      const cachedToken = getCachedIdToken(userToken);
      if (cachedToken) {
        idToken = cachedToken;
      } else {
        const refreshResult = await refreshIdToken(refreshToken, userToken);
        if (refreshResult) {
          idToken = refreshResult.idToken;
          refreshToken = refreshResult.newRefreshToken;
          refreshedCookies = true;
        }
      }
    }

    // 3. Fallback: Perform Fresh Signup if no cookies exist
    if (!idToken || !userToken || !refreshToken || !sessionId) {
      const signupData = await performAnonymousSignup();
      if (!signupData) {
        return NextResponse.json(
          { success: false, error: 'Firebase authentication failed' }, 
          { status: 500 }
        );
      }

      userToken = signupData.userToken;
      idToken = signupData.idToken;
      refreshToken = signupData.refreshToken;
      sessionId = crypto.randomUUID();
      needToSetCookies = true;

      cacheIdToken(userToken, idToken, signupData.expiresInSeconds);
    }

    // 4. Map query filters to Koupon Parameters
    const queryParams = new URLSearchParams();
    queryParams.append('keyword', query);
    
    // Koupon is 0-indexed for pages (page 1 -> index 0)
    const kouponPage = Math.max(0, Number(page) - 1);
    queryParams.append('page', String(kouponPage));
    queryParams.append('pageSize', limit);

    // Map Sort Options
    let kouponSort = '1'; // default: relevance
    if (sortBy === 'price_asc') {
      kouponSort = '3';
    } else if (sortBy === 'price_desc') {
      kouponSort = '2';
    } else if (sortBy === 'newest') {
      kouponSort = '4';
    }
    queryParams.append('sort', kouponSort);

    // Map platforms
    if (platforms.length > 0) {
      platforms.forEach(p => {
        if (p) queryParams.append('plt[]', p.toLowerCase());
      });
    }

    // Map Category Display Name to Koupon Category ID
    if (categoryName) {
      const mappedId = CATEGORY_MAP[categoryName.toLowerCase()];
      if (mappedId) {
        queryParams.append('category', mappedId);
      }
    }

    // Map Discounts Filter to fTags[]
    if (hasPromoCode) {
      queryParams.append('fTags[]', '2'); // Promo Codes
    }
    if (hasPriceDrop) {
      queryParams.append('fTags[]', '7'); // Coupons
      queryParams.append('fTags[]', '9'); // Prime / Price drops
      queryParams.append('fTags[]', '8'); // Special/Other
    }

    // Map discounts array directly to discount[]
    if (discounts.length > 0) {
      discounts.forEach(d => {
        if (d) queryParams.append('discount[]', d);
      });
    }

    // Map price range to price[] array
    if (minPrice || maxPrice) {
      const min = minPrice || '0';
      const max = maxPrice || '100000';
      queryParams.append('price[]', min);
      queryParams.append('price[]', max);
    }

    const url = `${KOUPON_SEARCH_URL}?${queryParams.toString()}`;
    console.log(`[Search API] Searching Koupon for "${query}": ${url}`);

    // 5. Execute Request
    let response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
        'Authorization': idToken,
        'user-token': userToken,
        'session-id': sessionId
      }
    });

    // 6. Self-healing token refresh on auth fail (401/403)
    if ((response.status === 401 || response.status === 403) && refreshToken) {
      console.warn('[Search API] Auth error. Retrying with fresh ID token...');
      const refreshResult = await refreshIdToken(refreshToken, userToken);
      if (refreshResult) {
        idToken = refreshResult.idToken;
        refreshToken = refreshResult.newRefreshToken;
        refreshedCookies = true;

        response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
            'Authorization': idToken,
            'user-token': userToken,
            'session-id': sessionId
          }
        });
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Search API] Upstream error ${response.status}:`, errorText);
      return NextResponse.json({ deals: [], hasNextPage: false });
    }

    const rawData = await response.json();
    const rawDeals = rawData.data?.deals || rawData.deals || [];
    const hasNextPage = rawData.data?.hasNextPage || rawData.hasNextPage || false;

    // 7. Format raw deals to align with DealCard UI structure
    const formattedDeals = rawDeals.map((item: any, index: number) => {
      return {
        id: item.id || `search-${index}`,
        asin: item.id || `search-${index}`,
        deal_hash: item.id || `search-${index}`,
        title: item.title || '',
        image: item.imgUrl || '',
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

    const apiResponse = NextResponse.json({
      deals: formattedDeals,
      hasNextPage: hasNextPage
    });

    // 8. Set dynamic browser cookies if required
    const maxAge = 10 * 365 * 24 * 60 * 60;
    if (needToSetCookies) {
      apiResponse.cookies.set('suggest_user_token', userToken, { maxAge, path: '/', httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
      apiResponse.cookies.set('suggest_refresh_token', refreshToken, { maxAge, path: '/', httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
      apiResponse.cookies.set('suggest_session_id', sessionId, { maxAge, path: '/', httpOnly: false, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    } else if (refreshedCookies) {
      apiResponse.cookies.set('suggest_refresh_token', refreshToken, { maxAge, path: '/', httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    }

    return apiResponse;

  } catch (error: any) {
    console.error('[Search API] Critical Internal Error:', error);
    return NextResponse.json({ deals: [], hasNextPage: false, error: error.message || String(error) });
  }
}
