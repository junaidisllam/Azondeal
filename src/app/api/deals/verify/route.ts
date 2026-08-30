import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { db } from '@/lib/db';

const BOT_EMAIL = 'activevoucher_verifier_bot@gmail.com';
const BOT_PASSWORD = 'SuperSecurePassword123!';

async function getRegisteredFirebaseToken(apiKey: string) {
  const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
  const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;

  // 1. Try Firebase login
  try {
    const res = await fetch(signInUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: BOT_EMAIL,
        password: BOT_PASSWORD,
        returnSecureToken: true
      })
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('[Deal Verify API] Firebase sign-in fetch error:', err);
  }

  // 2. If login fails, try Firebase sign-up
  try {
    const res = await fetch(signUpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: BOT_EMAIL,
        password: BOT_PASSWORD,
        returnSecureToken: true
      })
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('[Deal Verify API] Firebase sign-up fetch error:', err);
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const { id, codeId } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Product ID (asin/id) is required' }, { status: 400 });
    }

    // 1. Resolve ASIN/ID
    let resolvedAsin = String(id);
    if (/^\d+$/.test(resolvedAsin)) {
      try {
        const deal = await db.deal.findUnique({
          where: { id: parseInt(resolvedAsin, 10) }
        });
        if (deal && deal.asin) {
          resolvedAsin = deal.asin;
        }
      } catch (dbErr) {
        console.error('[Deal Verify API] Database lookup failed for id:', resolvedAsin, dbErr);
      }
    }

    // 2. Resolve codeId
    let resolvedCodeId = codeId || '';
    if (!resolvedCodeId) {
      const sanitizedAsin = resolvedAsin.replace(/[^a-zA-Z0-9-_]/g, '_');
      const detailCacheFile = path.join(process.cwd(), 'tmp', `detail_${sanitizedAsin}.json`);

      // Try reading from cache
      if (fs.existsSync(detailCacheFile)) {
        try {
          const cacheContent = fs.readFileSync(detailCacheFile, 'utf-8');
          const cacheData = JSON.parse(cacheContent);
          if (cacheData.deal && cacheData.deal.code_id) {
            resolvedCodeId = cacheData.deal.code_id;
            console.log(`[Deal Verify API] Resolved codeId from cache: ${resolvedCodeId}`);
          }
        } catch (err) {
          console.error('[Deal Verify API] Error reading cache file for codeId:', err);
        }
      }

      // If still not found, do fallback fetch from Koupon next.js JSON endpoint
      if (!resolvedCodeId) {
        try {
          const buildIdFile = path.join(process.cwd(), 'tmp', 'build_id.json');
          let buildId = 'dkEmxjhggferMfQvL3A6p';
          if (fs.existsSync(buildIdFile)) {
            const buildIdData = JSON.parse(fs.readFileSync(buildIdFile, 'utf-8'));
            if (buildIdData.buildId) {
              buildId = buildIdData.buildId;
            }
          }

          let platform = 'p';
          if (resolvedAsin.includes('v1|')) {
            platform = 'ebay';
          } else if (/^\d+$/.test(resolvedAsin)) {
            platform = 'walmart';
          }

          const url = `https://www.koupon.ai/_next/data/${encodeURIComponent(buildId)}/product/${platform}/${encodeURIComponent(resolvedAsin)}.json`;
          let res = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
              'Accept': 'application/json'
            },
            cache: 'no-store'
          });

          if (!res.ok && res.status === 404) {
            // Try updating build ID
            const avRes = await fetch('https://api.activevoucher.com/get_build_id.php', { cache: 'no-store' });
            const avData = await avRes.json();
            if (avData?.status === 'success' && avData?.buildId) {
              buildId = avData.buildId;
              const fallbackUrl = `https://www.koupon.ai/_next/data/${encodeURIComponent(buildId)}/product/${platform}/${encodeURIComponent(resolvedAsin)}.json`;
              res = await fetch(fallbackUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
                  'Accept': 'application/json'
                },
                cache: 'no-store'
              });
            }
          }

          if (res.ok) {
            const nextData = await res.json();
            const product = nextData?.pageProps?.deal || nextData?.pageProps?.product || {};
            if (product.promocodeId) {
              resolvedCodeId = product.promocodeId;
              console.log(`[Deal Verify API] Resolved codeId from live fallback fetch: ${resolvedCodeId}`);
            }
          }
        } catch (err) {
          console.error('[Deal Verify API] Fallback fetch for codeId failed:', err);
        }
      }
    }

    const apiKey = 'AIzaSyA9vnqklMIZmxM4SkD4Io8vbRjgI7mcVW4';
    const authData = await getRegisteredFirebaseToken(apiKey);

    if (!authData || !authData.idToken || !authData.localId) {
      return NextResponse.json({ error: 'Failed to authenticate registered Firebase account' }, { status: 500 });
    }

    const idToken = authData.idToken;
    const localId = authData.localId;
    const sessionId = crypto.randomUUID();

    // Perform the verification call to Koupon.ai
    const verifyUrl = 'https://www.koupon.ai/api/deal/verify';
    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9,bn;q=0.8',
        'authorization': `Bearer ${idToken}`,
        'user-token': localId,
        'session-id': sessionId,
        'content-type': 'application/json',
        'origin': 'https://www.koupon.ai',
        'referer': `https://www.koupon.ai/product/amazon-promo-codes/${resolvedAsin}`,
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
        'x-enforce-ver': '1',
      },
      body: JSON.stringify({
        id: resolvedAsin,
        codeId: resolvedCodeId,
        scene: 'regular',
        lastTime: Date.now()
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Koupon API verification failed: ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[Deal Verify API] Error:', error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
