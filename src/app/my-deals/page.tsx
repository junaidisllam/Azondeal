import React from 'react'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { DealCard } from '@/components/DealCard'
import { ShoppingBag, Heart } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'My Saved Deals | Azon Deal',
  description: 'View and manage all your saved handpicked deals and promo codes.',
}

const formatPrice = (price: any) => {
  if (price === undefined || price === null) return '';
  const num = Number(price);
  return isNaN(num) ? price : num.toFixed(2).replace(/\.?0+$/, '');
};

const formatDeal = (item: any) => ({
  asin: item.asin || item.deal_hash,
  id: item.id,
  hash: item.deal_hash,
  title: item.title,
  image: item.image || item.image_url,
  discount: item.discount_percentage ? `${Math.round(item.discount_percentage)}% OFF` : 'Deal',
  price: `$${formatPrice(item.discounted_price || item.price)}`,
  originalPrice: `$${formatPrice(item.list_price || item.price)}`,
  promo_code: item.promo_code,
  hasPromo: !!(item.promo_code || item.has_promo_code),
  rating: item.avg_rating || 4.5,
  reviews: item.ratings_count || 0,
  sold: item.bought_past_month > 0 ? `${item.bought_past_month}+ Sold` : undefined,
  store: item.merchant_name || 'Amazon'
});

export default async function MyDealsPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/')
  }

  const savedDeals = await db.saveddeal.findMany({
    where: { userId: session.user.id },
    include: {
      deal: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const deals = savedDeals.map((sd: any) => formatDeal(sd.deal))

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20">
      <div className="max-w-[1280px] mx-auto px-4 pt-10 sm:pt-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-2">My Saved Deals</h1>
            <p className="text-zinc-500 text-lg">You have {deals.length} deals saved in your wishlist</p>
          </div>
          <Link href="/">
            <button className="bg-white border border-zinc-200 text-zinc-700 font-semibold px-6 py-3 rounded-2xl hover:bg-zinc-50 transition-colors shadow-sm flex items-center gap-2">
              <ShoppingBag size={20} />
              Browse More Deals
            </button>
          </Link>
        </div>

        {deals.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {deals.map((deal: any) => (
              <DealCard key={deal.id} deal={deal} isSaved={true} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-[32px] border border-dashed border-zinc-200">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <Heart size={40} className="text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Your wishlist is empty</h2>
            <p className="text-zinc-500 text-center max-w-md mb-8 italic">
              "Click the heart icon on any deal to save it here for later. Don't miss out on your favorite discounts!"
            </p>
            <Link href="/">
              <button className="bg-primary text-white font-bold px-10 py-4 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95">
                Explore Top Deals
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
