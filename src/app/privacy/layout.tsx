import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read the AzonDeal Privacy Policy to understand how we collect, use, and protect your personal information when you use our platform for deal hunting.",
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
