import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Deals",
  description: "Search for specific products, brands, or categories to find the best current coupons and promo codes available on AzonDeal.",
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
