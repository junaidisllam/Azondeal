import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { dealId, asin } = await req.json()
    if (!dealId && !asin) {
      return NextResponse.json({ error: 'Deal ID or ASIN is required' }, { status: 400 })
    }

    let dId: number | null = null

    const parsedDealId = dealId ? parseInt(String(dealId), 10) : NaN
    const isNumericId = !isNaN(parsedDealId)

    if (isNumericId) {
      dId = parsedDealId
    }

    if (!dId) {
      const targetAsin = asin || (typeof dealId === 'string' ? dealId : '')
      let deal = await db.deal.findUnique({
        where: { asin: targetAsin },
        select: { id: true }
      })
      
      if (!deal) {
        // Product not found, fetch from external API and create it
        console.log(`[SaveDeal API] ASIN ${asin} not found in DB. Fetching from Koupon...`)
        try {
          const fs = await import('fs');
          const path = await import('path');
          
          const CACHE_DIR = path.join(process.cwd(), 'tmp');
          const CACHE_FILE = path.join(CACHE_DIR, 'build_id.json');
          const BUILD_ID_API_URL = 'https://api.activevoucher.com/get_build_id.php';

          const getBuildId = (): string => {
            try {
              if (fs.existsSync(CACHE_FILE)) {
                const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
                if (data.buildId) return data.buildId;
              }
            } catch (_) {}
            return 'dkEmxjhggferMfQvL3A6p';
          };

          const fetchProductJson = async (productId: string, bid: string) => {
            const decodedId = decodeURIComponent(productId);
            let platform = 'p';
            if (decodedId.includes('v1|')) platform = 'ebay';
            else if (/^\d+$/.test(decodedId)) platform = 'walmart';

            const url = `https://www.koupon.ai/_next/data/${encodeURIComponent(bid)}/product/${platform}/${encodeURIComponent(decodedId)}.json`;
            return await fetch(url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
                'Accept': 'application/json'
              },
              cache: 'no-store'
            });
          };

          let buildId = getBuildId();
          let response = await fetchProductJson(asin, buildId);

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
              try {
                const kouponHomeRes = await fetch('https://www.koupon.ai/', {
                  headers: { 'User-Agent': 'Mozilla/5.0' },
                  cache: 'no-store'
                });
                if (kouponHomeRes.ok) {
                  const html = await kouponHomeRes.text();
                  const match = html.match(/"buildId":"([^"]+)"/);
                  if (match && match[1]) newBuildId = match[1];
                }
              } catch (_) {}
            }

            if (newBuildId) {
              buildId = newBuildId;
              try {
                if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
                fs.writeFileSync(CACHE_FILE, JSON.stringify({ buildId, timestamp: Date.now() }, null, 2), 'utf-8');
              } catch (_) {}
              response = await fetchProductJson(asin, buildId);
            }
          }

          if (response.ok) {
            const nextData = await response.json();
            const pageProps = nextData?.pageProps;
            const product = pageProps?.deal || pageProps?.product;

            if (product) {
              const rawImages = product.images || [];
              const imageIds = Array.isArray(rawImages)
                ? rawImages.map((img: any) => typeof img === 'string' ? img : (img.url || ''))
                : [];
              const mainImageUrl = typeof product.imgUrl === 'string'
                ? product.imgUrl
                : (product.mainImage || product.image?.url || (imageIds && imageIds[0]) || '');
              const finalImageIds = imageIds.length > 0 ? imageIds : [mainImageUrl];

              console.log(`[SaveDeal API] Creating new deal for ASIN from Koupon: ${product.id || asin}`);
              
              deal = await db.deal.create({
                data: {
                  asin: product.id || asin,
                  title: product.title || 'Product Title',
                  image: mainImageUrl,
                  price: parseFloat(product.comparedPrice || product.price) || 0,
                  discounted_price: parseFloat(product.price) || 0,
                  discount_percentage: parseFloat(product.discount) || 0,
                  promo_code: product.code || '',
                  avg_rating: parseFloat(product.rating) || 4.5,
                  ratings_count: parseInt(product.ratingsTotal) || 0,
                  merchant_name: product.platform
                    ? (product.platform.charAt(0).toUpperCase() + product.platform.slice(1))
                    : (asin.includes('v1|') ? 'eBay' : (/^\d+$/.test(asin) ? 'Walmart' : 'Amazon')),
                  deal_hash: product.id || asin,
                  image_ids: JSON.stringify(finalImageIds),
                  has_coupon: !!product.code,
                  coupon_value: product.code || '',
                  promo_string: product.highlights || '',
                  bought_past_month: parseInt(product.monthlySold) || 0,
                  codes: JSON.stringify(product.code ? [product.code] : []),
                  variation_asins: JSON.stringify((product.variants || []).map((v: any) => v.id))
                }
              });
              console.log(`[SaveDeal API] Successfully created deal ID: ${deal.id}`);
            } else {
              console.error(`[SaveDeal API] Koupon returned no product details for ASIN: ${asin}`);
            }
          } else {
            console.error(`[SaveDeal API] Koupon API error: ${response.status}`);
          }
        } catch (fetchError: any) {
          console.error("[SaveDeal API] Failed to fetch and create missing deal from Koupon:", fetchError.message);
        }
      }

      if (!deal) {
        console.error(`[SaveDeal API] Final check: Deal for ASIN ${asin} is still null`)
        return NextResponse.json({ 
          error: 'Product not found and could not be created',
          reason: 'External API did not return data or database creation failed',
          asin: asin
        }, { status: 404 })
      }
      dId = deal.id
    }

    if (!dId) {
      return NextResponse.json({ error: 'Valid Deal ID is required. Please provide a valid product.' }, { status: 400 })
    }

    if (!db.saveddeal) {
      return NextResponse.json({ error: 'Database model not ready' }, { status: 503 })
    }

    // Toggle logic: If exists, delete. If not, create.
    const existing = await db.saveddeal.findUnique({
      where: {
        userId_dealId: {
          userId: session.user.id,
          dealId: dId
        }
      }
    })

    if (existing) {
      await db.saveddeal.delete({
        where: {
          userId_dealId: {
            userId: session.user.id,
            dealId: dId
          }
        }
      })
      return NextResponse.json({ saved: false, message: 'Deal removed from wishlist' })
    } else {
      await db.saveddeal.create({
        data: {
          id: `${session.user.id}_${dId}`, // Manually providing the required string ID
          userId: session.user.id,
          dealId: dId
        }
      })
      return NextResponse.json({ saved: true, message: 'Deal saved to wishlist' })
    }
  } catch (error: any) {
    console.error('[SaveDeal API Error]:', error)
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message 
    }, { status: 500 })
  }
}

// Get user's saved deal IDs and ASINs for UI initialization
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ savedIds: [], savedAsins: [] })
    }

    if (!db.saveddeal) {
      return NextResponse.json({ savedIds: [], savedAsins: [] })
    }

    const saved = await db.saveddeal.findMany({
      where: { userId: session.user.id },
      include: {
        deal: {
          select: { asin: true }
        }
      }
    })

    return NextResponse.json({ 
      savedIds: saved.map((s: any) => s.dealId),
      savedAsins: saved.map((s: any) => s.deal.asin)
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message 
    }, { status: 500 })
  }
}
