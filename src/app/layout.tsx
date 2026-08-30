import { Inter } from "next/font/google";
import "./globals.css";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://azondeal.com"),
  title: {
    default: "Azon Deal | Best Daily Deals & Promo Codes",
    template: "%s | Azon Deal"
  },
  description: "Discover the best handpicked daily deals, exclusive promo codes, and massive savings on Amazon, Walmart, and your favorite brands. Updated 24/7.",
  keywords: ["daily deals", "promo codes", "amazon coupons", "best discounts", "saving money", "azon deal", "azondeal", "shopping deals"],
  authors: [{ name: "Azon Deal Team" }],
  manifest: "/manifest.json",
  icons: {
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://azondeal.com",
    siteName: "Azon Deal",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Azon Deal - Best Daily Deals",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Azon Deal | Best Daily Deals & Promo Codes",
    description: "Handpicked deals and coupons updated every hour. Save big on your favorite brands.",
    images: ["/logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#d8492d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { isDbConfigured } from "@/lib/db-config";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isConfigured = isDbConfigured();
  // Pathname is injected by middleware.ts
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // Redirect to setup if not configured
  const isSetupPage = pathname.startsWith("/setup") || pathname.startsWith("/api/setup");
  if (!isConfigured && !isSetupPage) {
    redirect("/setup");
  }

  // Redirect to home if already configured and trying to access setup
  if (isConfigured && isSetupPage) {
    redirect("/");
  }
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Azon Deal",
    "url": "https://azondeal.com",
    "logo": "https://azondeal.com/logo.png",
    "description": "Your premier destination for the best daily deals and promo codes.",
    "sameAs": [
      // Add social links here if available
    ]
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Azon Deal",
    "url": "https://azondeal.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://azondeal.com/search?query={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  // Fetch custom scripts if configured
  let customScripts = { header: "", footer: "" };
  if (isConfigured) {
    try {
      const { db } = await import("@/lib/db");
      const settings = await db.setting.findMany({
        where: {
          key: { in: ["header_scripts", "footer_scripts"] },
        },
      });
      customScripts = {
        header: settings.find((s) => s.key === "header_scripts")?.value || "",
        footer: settings.find((s) => s.key === "footer_scripts")?.value || "",
      };
    } catch (e) {
      console.error("[RootLayout] Failed to fetch scripts:", e);
    }
  }

  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {/* User-defined Header Scripts */}
        {customScripts.header && (
          <div
            style={{ display: 'none' }}
            dangerouslySetInnerHTML={{ __html: customScripts.header }}
          />
        )}

        <LayoutWrapper isConfigured={isConfigured}>
          {children}
        </LayoutWrapper>

        {/* User-defined Footer Scripts */}
        {customScripts.footer && (
          <div
            style={{ display: 'none' }}
            dangerouslySetInnerHTML={{ __html: customScripts.footer }}
          />
        )}
      </body>
    </html>
  );
}
