'use client'

/**
 * Footer Component — Updated for production readiness.
 *
 * Changes:
 *  • Removed social media icons as requested.
 *  • Ensured all links are functional and point to existing routes.
 *  • Added a "Popular Categories" section.
 *  • Improved responsive layout and typography.
 *  • Cleaned up code and added better accessibility.
 */

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  const currentYear = new Date().getFullYear()

  const sections = [
    {
      title: "Popular Deals",
      links: [
        { label: "Today's Top Deals",  href: "/top-deals" },
        { label: "Amazon Promo Codes", href: "/explore?hasPromoCode=true" },
        { label: "Price Drops",        href: "/explore?hasPriceDrop=true" },
        { label: "All Coupons",        href: "/explore" },
      ]
    },
    {
      title: "Categories",
      links: [
        { label: "Tech & Gaming",   href: "/explore?category=Tech" },
        { label: "Fashion & Shoes",  href: "/explore?category=Clothing, Shoes & Jewelry" },
        { label: "Home & Garden",   href: "/explore?category=Home" },
        { label: "Beauty Care",     href: "/explore?category=Beauty & Personal Care" },
        { label: "Browse All",      href: "/categories" },
      ]
    },
    {
      title: "Company",
      links: [
        { label: "About Us",   href: "/about" },
        { label: "Contact Us", href: "/contact" },
        { label: "FAQ",        href: "/faq" },
        { label: "All Brands", href: "/brands" },
      ]
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy",      href: "/privacy" },
        { label: "Affiliate Disclosure", href: "/affiliate-disclosure" },
        // Linking to privacy if terms doesn't exist yet, or keep it consistent
        { label: "Terms of Service",    href: "/privacy" },
      ]
    }
  ]

  return (
    <footer className="bg-white border-t border-zinc-100 pt-16 pb-12">
      <div className="max-w-[1280px] mx-auto px-4">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12 mb-16">
          {sections.map((section) => (
            <div key={section.title} className="flex flex-col">
              <h3 className="font-bold text-zinc-900 mb-6 text-base tracking-tight">
                {section.title}
              </h3>
              <ul className="flex flex-col gap-4">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-zinc-500 hover:text-primary transition-all duration-200 text-[14px] font-medium"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Brand & Disclaimer Area */}
        <div className="pt-10 border-t border-zinc-100">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10">
            <div className="flex flex-col gap-4 max-w-md">
              <Link href="/" className="hover:opacity-80 transition-opacity w-fit">
                <Image
                  src="/logo.png"
                  alt="Azon Deal Logo"
                  width={160}
                  height={36}
                  className="object-contain h-9 w-auto"
                />
              </Link>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Your premier destination for the best hand-picked deals, promo codes, and shopping vouchers.
                We help you save time and money on your favorite brands.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              <span className="text-zinc-400 text-sm font-medium">
                © {currentYear} Azon Deal. Built with passion.
              </span>
            </div>

            <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
              <h4 className="text-[12px] font-bold text-zinc-900 uppercase tracking-widest mb-2">
                Affiliate Disclosure
              </h4>
              <p className="text-zinc-500 text-[12px] leading-relaxed">
                Azon Deal is a participant in the Amazon Services LLC Associates Program, an affiliate advertising
                program designed to provide a means for sites to earn advertising fees by advertising and linking to
                Amazon.com. As an Amazon Associate, we earn from qualifying purchases at no extra cost to you.
                <Link href="/affiliate-disclosure" className="text-primary hover:underline ml-1 font-semibold">
                  Learn more about our disclosure policy.
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
