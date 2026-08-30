import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Have questions about a deal or need support? Reach out to the AzonDeal team. We're here to help you get the most out of your shopping experience.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
