import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn more about AzonDeal, our mission to simplify deal hunting, and how we help thousands of shoppers save money every day through handpicked verified deals.",
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
