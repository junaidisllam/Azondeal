import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Affiliate Disclosure",
  description: "Transparency is our priority. Learn how AzonDeal partners with brands and retailers to bring you the best deals, and how we may earn commissions at no cost to you.",
};

export default function AffiliateDisclosureLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
