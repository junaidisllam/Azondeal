import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Top Deals & Coupons",
  description: "Browse the hottest handpicked deals, trending discounts, and limited-time promo codes. Save big on electronics, home goods, fashion, and more with AzonDeal.",
};

export default function TopDealsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
