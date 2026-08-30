import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import dns from 'dns';
import crypto from 'crypto';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  console.warn('[Top Promo Code API] Failed to set DNS result order:', e);
}

const API_KEY = 'AIzaSyA9vnqklMIZmxM4SkD4Io8vbRjgI7mcVW4';
const AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
const KOUPON_COLLECTION_URL = 'https://www.koupon.ai/api/collection/v1';

const CACHE_DIR = path.join(process.cwd(), 'tmp');
const TOKEN_CACHE_FILE = path.join(CACHE_DIR, 'firebase_collection_token.json');

interface AuthCredentials {
  token: string;
  userToken: string;
  expiresAt: number;
}

// Helper function to fetch the Firebase authentication token (caches until expiry)
async function getAuthCredentials(): Promise<AuthCredentials | null> {
  try {
    if (fs.existsSync(TOKEN_CACHE_FILE)) {
      try {
        const cacheContent = fs.readFileSync(TOKEN_CACHE_FILE, 'utf-8');
        const cacheData = JSON.parse(cacheContent) as AuthCredentials;
        const bufferTimeMs = 5 * 60 * 1000; // 5 minutes buffer
        
        if (cacheData.token && cacheData.userToken && cacheData.expiresAt && Date.now() < cacheData.expiresAt - bufferTimeMs) {
          return cacheData;
        }
      } catch (_) {}
    }

    const res = await fetch(AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnSecureToken: true }),
    });

    if (!res.ok) {
      console.error('[Top Promo Code API] Firebase auth failed:', res.status);
      return null;
    }

    const data = await res.json();
    if (!data || !data.idToken || !data.localId) return null;

    const credentials: AuthCredentials = {
      token: `Bearer ${data.idToken}`,
      userToken: data.localId,
      expiresAt: Date.now() + Number(data.expiresIn || '3600') * 1000
    };

    try {
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }
      fs.writeFileSync(
        TOKEN_CACHE_FILE,
        JSON.stringify(credentials, null, 2),
        'utf-8'
      );
    } catch (_) {}

    return credentials;
  } catch (err) {
    console.error('[Top Promo Code API] Error getting auth credentials:', err);
    return null;
  }
}

export async function GET() {
  try {
    const creds = await getAuthCredentials();
    if (!creds) {
      return NextResponse.json({ deals: [] });
    }

    const requestBody = {
      id: 'amazon-promo-codes',
      page: 0,
      size: 15,
      sort: 1,
      plt: [],
      filters: [],
      cardTypes: [],
      ci: [],
      cn: []
    };

    let response = await fetch(KOUPON_COLLECTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
        'Authorization': creds.token,
        'user-token': creds.userToken,
        'session-id': '3377f843-52c0-474c-8c0c-c6967ccca24c'
      },
      body: JSON.stringify(requestBody),
      next: { revalidate: 3600 }
    });

    // Self-healing token refresh on auth fail
    if (response.status === 401 || response.status === 403) {
      try {
        if (fs.existsSync(TOKEN_CACHE_FILE)) {
          fs.unlinkSync(TOKEN_CACHE_FILE);
        }
      } catch (_) {}
      
      const freshCreds = await getAuthCredentials();
      if (freshCreds) {
        response = await fetch(KOUPON_COLLECTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
            'Authorization': freshCreds.token,
            'user-token': freshCreds.userToken,
            'session-id': '3377f843-52c0-474c-8c0c-c6967ccca24c'
          },
          body: JSON.stringify(requestBody),
          next: { revalidate: 3600 }
        });
      }
    }

    if (!response.ok) {
      console.error(`[Top Promo Code API] Status ${response.status}`);
      return NextResponse.json({ deals: [] });
    }

    const rawData = await response.json();
    const rawDeals = rawData.data?.deals || rawData.deals || [];

    const formattedDeals = rawDeals.map((item: any, index: number) => ({
      asin: item.id || `promo-${index}`,
      deal_hash: item.id || `promo-${index}`,
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
    }));

    return NextResponse.json({ deals: formattedDeals });
  } catch (error: any) {
    console.error('Error fetching top promo codes:', error);
    return NextResponse.json({ deals: [], error: error.message });
  }
}
