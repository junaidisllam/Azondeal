import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dns from 'dns';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  console.warn('[Price API] Failed to set DNS result order:', e);
}

const API_KEY = 'AIzaSyA9vnqklMIZmxM4SkD4Io8vbRjgI7mcVW4';
const AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
const REFRESH_TOKEN_URL = `https://securetoken.googleapis.com/v1/token?key=${API_KEY}`;
const KOUPON_PRICE_URL = 'https://www.koupon.ai/api/search/v1/price';

const CACHE_DIR = path.join(process.cwd(), 'tmp');
const ID_TOKEN_CACHE_DIR = path.join(CACHE_DIR, 'id_tokens');

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

function cacheIdToken(localId: string, idToken: string, expiresInSeconds: number) {
  try {
    if (!fs.existsSync(ID_TOKEN_CACHE_DIR)) {
      fs.mkdirSync(ID_TOKEN_CACHE_DIR, { recursive: true });
    }
    const tokenFile = path.join(ID_TOKEN_CACHE_DIR, `${localId}.json`);
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    fs.writeFileSync(tokenFile, JSON.stringify({ idToken, expiresAt }), 'utf-8');
  } catch (err) {
    console.error('[Price API] Failed to cache ID token:', err);
  }
}

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
      console.error('[Price API] Refreshing token failed:', res.status);
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
    console.error('[Price API] Error in refreshIdToken:', err);
    return null;
  }
}

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
      console.error('[Price API] Anonymous signup failed:', res.status);
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
    console.error('[Price API] Error in performAnonymousSignup:', err);
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
    const platforms = searchParams.getAll('plt[]').length > 0 
      ? searchParams.getAll('plt[]') 
      : (searchParams.get('plt') ? [searchParams.get('plt') as string] : []);

    const cookieStore = await cookies();
    userToken = cookieStore.get('suggest_user_token')?.value || null;
    refreshToken = cookieStore.get('suggest_refresh_token')?.value || null;
    sessionId = cookieStore.get('suggest_session_id')?.value || null;

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

    const queryParams = new URLSearchParams();
    queryParams.append('keyword', query);
    if (platforms.length > 0) {
      platforms.forEach(p => {
        if (p) queryParams.append('plt[]', p.toLowerCase());
      });
    }

    const url = `${KOUPON_PRICE_URL}?${queryParams.toString()}`;
    console.log(`[Price API] Fetching limits: ${url}`);

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

    if ((response.status === 401 || response.status === 403) && refreshToken) {
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
      return NextResponse.json({ min: 0, max: 1000 });
    }

    const rawData = await response.json();
    const priceInfo = rawData.data?.price || {};
    
    // We get min, max, count etc.
    const result = {
      min: typeof priceInfo.min === 'number' ? priceInfo.min : 0,
      max: typeof priceInfo.max === 'number' ? priceInfo.max : 1000,
    };

    const apiResponse = NextResponse.json(result);

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
    console.error('[Price API] Critical Internal Error:', error);
    return NextResponse.json({ min: 0, max: 1000, error: error.message || String(error) });
  }
}
