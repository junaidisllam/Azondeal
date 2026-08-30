import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import dns from 'dns';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  console.warn('[Search Suggestions API] Failed to set DNS result order:', e);
}

const SUGGEST_API_URL = 'https://www.koupon.ai/api/search/v1/suggest';
const DEFAULT_USER_TOKEN = 'XfKYT5pe6qUqmKBHTeFOUrh920m1';

async function fetchSuggestions(input: string) {
  if (!input) {
    return { suggestions: [] };
  }

  const suggestionsSet = new Set<string>();

  // 1. Fetch suggestions from local database (deals)
  try {
    const localDeals = await db.deal.findMany({
      where: {
        OR: [
          { title: { contains: input } },
          { merchant_name: { contains: input } }
        ]
      },
      select: {
        title: true
      },
      take: 5
    });

    localDeals.forEach(deal => {
      if (deal.title) {
        const words = deal.title.split(' ');
        if (words.length > 6) {
          suggestionsSet.add(words.slice(0, 6).join(' ').replace(/[,.:;!?"']/g, ''));
        } else {
          suggestionsSet.add(deal.title);
        }
      }
    });
  } catch (dbError) {
    console.error('[Search Suggestions API] Database fetch error:', dbError);
  }

  // 2. Fetch suggestions from Koupon API
  try {
    let userToken = DEFAULT_USER_TOKEN;
    try {
      const cookieStore = await cookies();
      const suggestUserToken = cookieStore.get('suggest_user_token')?.value;
      if (suggestUserToken) {
        userToken = suggestUserToken;
      }
    } catch (_) {}

    const url = `${SUGGEST_API_URL}?input=${encodeURIComponent(input)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
        'user-token': userToken,
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (response.ok) {
      const rawData = await response.json();
      
      let list = [];
      if (rawData.suggestions && Array.isArray(rawData.suggestions)) {
        list = rawData.suggestions;
      } else if (rawData.data && Array.isArray(rawData.data.suggestions)) {
        list = rawData.data.suggestions;
      } else if (rawData.data && Array.isArray(rawData.data)) {
        list = rawData.data;
      } else if (rawData.list && Array.isArray(rawData.list)) {
        list = rawData.list;
      }

      list.forEach((item: any) => {
        const queryStr = typeof item === 'string' ? item : (item.query || item.name || String(item));
        if (queryStr) {
          suggestionsSet.add(queryStr);
        }
      });
    }
  } catch (apiError) {
    console.error('[Search Suggestions API] External API fetch error:', apiError);
  }

  return { suggestions: Array.from(suggestionsSet).slice(0, 10) };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get('input') || searchParams.get('query') || '';
    
    const data = await fetchSuggestions(input);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = body.input || body.query || '';

    const data = await fetchSuggestions(input);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Search Suggestions API] Internal Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions', details: error.message }, 
      { status: 500 }
    );
  }
}
