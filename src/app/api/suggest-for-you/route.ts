import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dns from 'dns';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  console.warn('[Suggest For You API] Failed to set DNS result order:', e);
}

const API_KEY = 'AIzaSyA9vnqklMIZmxM4SkD4Io8vbRjgI7mcVW4';
const AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
const REFRESH_TOKEN_URL = `https://securetoken.googleapis.com/v1/token?key=${API_KEY}`;
const KOUPON_RECOMMEND_URL = 'https://www.koupon.ai/api/recommend';

const CACHE_DIR = path.join(process.cwd(), 'tmp');
const ID_TOKEN_CACHE_DIR = path.join(CACHE_DIR, 'id_tokens');

// Helper to write an ID token to a local temporary cache file to avoid refreshing on every request
function getCachedIdToken(localId: string): string | null {
  const tokenFile = path.join(ID_TOKEN_CACHE_DIR, `${localId}.json`);
  if (fs.existsSync(tokenFile)) {
    try {
      const content = fs.readFileSync(tokenFile, 'utf-8');
      const cacheData = JSON.parse(content);
      const safetyBufferMs = 5 * 60 * 1000; // 5 minutes buffer
      if (cacheData.idToken && cacheData.expiresAt && Date.now() < cacheData.expiresAt - safetyBufferMs) {
        return cacheData.idToken;
      }
    } catch (_) {}
  }
  return null;
}

function cacheIdToken(localId: string, idToken: string, expiresInSeconds: number) {
  try {
    if (!fs.existsSync(ID_TOKEN_CACHE_DIR)) {
      fs.mkdirSync(ID_TOKEN_CACHE_DIR, { recursive: true });
    }
    const tokenFile = path.join(ID_TOKEN_CACHE_DIR, `${localId}.json`);
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    fs.writeFileSync(tokenFile, JSON.stringify({ idToken, expiresAt }), 'utf-8');
  } catch (err) {
    console.error('[Suggest For You API] Failed to cache ID token:', err);
  }
}

// Function to refresh an existing Firebase ID Token using the refresh token
async function refreshIdToken(refreshToken: string, localId: string): Promise<{ idToken: string; newRefreshToken: string } | null> {
  try {
    console.log(`[Suggest For You API] Refreshing Firebase ID token for localId: ${localId}`);
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
      console.error('[Suggest For You API] Refreshing ID token failed:', res.status);
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
    console.error('[Suggest For You API] Error in refreshIdToken:', err);
    return null;
  }
}

// Function to perform dynamic anonymous Firebase signup
async function performAnonymousSignup(): Promise<{ userToken: string; idToken: string; refreshToken: string; expiresInSeconds: number } | null> {
  try {
    console.log('[Suggest For You API] Performing a fresh anonymous Firebase signup...');
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
      console.error('[Suggest For You API] Anonymous signup failed:', res.status);
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
    console.error('[Suggest For You API] Error in performAnonymousSignup:', err);
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
    const page = searchParams.get('page') || '0';
    const pageSize = searchParams.get('pageSize') || searchParams.get('limit') || '20';
    const category = searchParams.get('category') || '';

    // 1. Read cookies from the user's browser
    const cookieStore = await cookies();
    userToken = cookieStore.get('suggest_user_token')?.value || null;
    refreshToken = cookieStore.get('suggest_refresh_token')?.value || null;
    sessionId = cookieStore.get('suggest_session_id')?.value || null;

    // 2. Determine if we have valid existing anonymous user credentials
    if (userToken && refreshToken && sessionId) {
      // User is already established. Try to fetch or renew their idToken.
      const cachedToken = getCachedIdToken(userToken);
      if (cachedToken) {
        idToken = cachedToken;
      } else {
        // Cache expired, use refreshToken to fetch a new idToken
        const refreshResult = await refreshIdToken(refreshToken, userToken);
        if (refreshResult) {
          idToken = refreshResult.idToken;
          refreshToken = refreshResult.newRefreshToken;
          refreshedCookies = true;
        }
      }
    }

    // 3. Fallback: If no existing credentials or token refresh failed, sign up anonymously
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

      // Cache the newly received idToken
      cacheIdToken(userToken, idToken, signupData.expiresInSeconds);
    }

    // 4. Query the Recommend API on Koupon.ai
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    
    if (category) {
      queryParams.append('size', pageSize);
      queryParams.append('category', category);
      queryParams.append('filters[]', '1');
      queryParams.append('plt[]', 'amazon');
      queryParams.append('cardTypes[]', '1');
    } else {
      queryParams.append('pageSize', pageSize);
    }
    
    const url = `${KOUPON_RECOMMEND_URL}?${queryParams.toString()}`;
    console.log(`[Suggest For You API] Fetching suggestions for User: ${userToken}, Session: ${sessionId}`);

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

    // 5. Self-healing refresh: if upstream returns Auth Error (401/403)
    if ((response.status === 401 || response.status === 403) && refreshToken) {
      console.warn('[Suggest For You API] Auth error from Koupon. Retrying with fresh ID token...');
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
      console.error(`[Suggest For You API] Koupon returned error ${response.status}:`, errorText);
      return NextResponse.json(
        { success: false, error: `Upstream service returned error: ${response.status}` },
        { status: response.status }
      );
    }

    const rawData = await response.json();
    const rawDeals = rawData.data?.deals || rawData.deals || rawData.data || [];

    if (!Array.isArray(rawDeals)) {
      console.error('[Suggest For You API] Invalid deals structure in response:', rawData);
      return NextResponse.json(
        { success: false, error: 'Invalid response structure from deals provider' },
        { status: 500 }
      );
    }

    // 6. Map the deals structure to match the frontend schema
    const formattedDeals = rawDeals.map((item: any, index: number) => {
      const cleanImageUrl = typeof item.imgUrl === 'string'
        ? item.imgUrl
        : (typeof item.image === 'string' ? item.image : (item.image?.url || ''));

      return {
        ...item,
        asin: item.id || `sug-${index}`,
        deal_hash: item.id || `sug-${index}`,
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

    // 7. Return the response and set permanent cookies if needed
    const apiResponse = NextResponse.json(formattedDeals);

    // Save cookies permanently (e.g. 10 years)
    const maxAge = 10 * 365 * 24 * 60 * 60; 

    if (needToSetCookies) {
      apiResponse.cookies.set('suggest_user_token', userToken, { maxAge, path: '/', httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
      apiResponse.cookies.set('suggest_refresh_token', refreshToken, { maxAge, path: '/', httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
      apiResponse.cookies.set('suggest_session_id', sessionId, { maxAge, path: '/', httpOnly: false, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
      console.log('[Suggest For You API] Successfully set permanent user-token and session-id cookies.');
    } else if (refreshedCookies) {
      // Keep refresh token cookie updated
      apiResponse.cookies.set('suggest_refresh_token', refreshToken, { maxAge, path: '/', httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
      console.log('[Suggest For You API] Successfully updated user refresh token cookie.');
    }

    return apiResponse;

  } catch (error: any) {
    console.error('[Suggest For You API] Critical Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || String(error) },
      { status: 500 }
    );
  }
}
