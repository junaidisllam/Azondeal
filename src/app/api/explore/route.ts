import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import dns from 'dns';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  console.warn('[Explore API] Failed to set DNS result order:', e);
}

const API_KEY = 'AIzaSyA9vnqklMIZmxM4SkD4Io8vbRjgI7mcVW4';
const AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
const KOUPON_SEARCH_URL = 'https://www.koupon.ai/api/search/v1';

const CACHE_DIR = path.join(process.cwd(), 'tmp');
const TOKEN_CACHE_FILE = path.join(CACHE_DIR, 'firebase_token.json');

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

async function getAuthToken(): Promise<string | null> {
  try {
    if (fs.existsSync(TOKEN_CACHE_FILE)) {
      try {
        const cacheContent = fs.readFileSync(TOKEN_CACHE_FILE, 'utf-8');
        const cacheData = JSON.parse(cacheContent);
        const bufferTimeMs = 5 * 60 * 1000;
        if (cacheData.token && cacheData.expiresAt && Date.now() < cacheData.expiresAt - bufferTimeMs) {
          return cacheData.token;
        }
      } catch (_) {}
    }

    const res = await fetch(AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnSecureToken: true }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.idToken) return null;

    const token = `Bearer ${data.idToken}`;
    const expiresAt = Date.now() + Number(data.expiresIn || '3600') * 1000;

    try {
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }
      fs.writeFileSync(TOKEN_CACHE_FILE, JSON.stringify({ token, expiresAt }, null, 2), 'utf-8');
    } catch (_) {}

    return token;
  } catch (err) {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '24';
    const categoryName = searchParams.get('category') || '';
    const sortBy = searchParams.get('sortBy') || 'recommended';

    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ deals: [], hasNextPage: false });
    }

    const queryParams = new URLSearchParams();
    queryParams.append('keyword', searchParams.get('keyword') || searchParams.get('query') || '');
    queryParams.append('page', String(Math.max(0, Number(page) - 1)));
    queryParams.append('pageSize', limit);

    // Sort mapping
    let kouponSort = '1';
    if (sortBy === 'price_asc') kouponSort = '3';
    else if (sortBy === 'price_desc') kouponSort = '2';
    else if (sortBy === 'newest') kouponSort = '4';
    queryParams.append('sort', kouponSort);

    // Category mapping
    if (categoryName) {
      const mappedId = CATEGORY_MAP[categoryName.toLowerCase()];
      if (mappedId) {
        queryParams.append('category', mappedId);
      }
    }

    // Platforms
    const platforms = searchParams.getAll('plt[]');
    if (platforms.length > 0) {
      platforms.forEach(p => queryParams.append('plt[]', p.toLowerCase()));
    }

    // Discounts
    const discounts = searchParams.getAll('discount[]');
    if (discounts.length > 0) {
      discounts.forEach(d => queryParams.append('discount[]', d));
    }

    // Price
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    if (minPrice || maxPrice) {
      queryParams.append('price[]', minPrice || '0');
      queryParams.append('price[]', maxPrice || '100000');
    }

    const url = `${KOUPON_SEARCH_URL}?${queryParams.toString()}`;

    let response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
        'Authorization': token
      },
      next: { revalidate: 3600 }
    });

    if (response.status === 401 || response.status === 403) {
      try {
        if (fs.existsSync(TOKEN_CACHE_FILE)) fs.unlinkSync(TOKEN_CACHE_FILE);
      } catch (_) {}
      const freshToken = await getAuthToken();
      if (freshToken) {
        response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
            'Authorization': freshToken
          },
          next: { revalidate: 3600 }
        });
      }
    }

    if (!response.ok) {
      return NextResponse.json({ deals: [], hasNextPage: false });
    }

    const rawData = await response.json();
    const rawDeals = rawData.data?.deals || rawData.deals || [];
    const hasNextPage = rawData.data?.hasNextPage || rawData.hasNextPage || false;

    const formattedDeals = rawDeals.map((item: any, index: number) => ({
      asin: item.id || `explore-${index}`,
      deal_hash: item.id || `explore-${index}`,
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

    return NextResponse.json({
      deals: formattedDeals,
      hasNextPage
    });

  } catch (error: any) {
    console.error('Error fetching explore deals:', error);
    return NextResponse.json({ deals: [], hasNextPage: false, error: error.message });
  }
}
