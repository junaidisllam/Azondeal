import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Brands",
  description: "Explore exclusive deals and coupons from your favorite brands. Browse our alphabetical list of retailers and manufacturers to find massive savings on products you love.",
};

export default function BrandsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
