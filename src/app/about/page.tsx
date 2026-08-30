'use client'

import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { 
  Search, 
  MousePointer2, 
  Copy, 
  Wallet, 
  ShieldCheck, 
  RefreshCw, 
  LayoutGrid, 
  UserPlus, 
  ShoppingBag, 
  DollarSign, 
  TicketPercent, 
  Tag, 
  Zap, 
  Star, 
  Grid,
  ArrowRight
} from 'lucide-react'
import { Button } from "@heroui/button"
import { Card, CardBody } from "@heroui/card"
import Link from 'next/link'

export default function AboutPage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5 }
  }

  const steps = [
    {
      icon: <Search className="text-primary" size={24} />,
      title: "Find a Deal",
      description: "Browse our curated list of Amazon promo codes, coupon codes, and exclusive offers."
    },
    {
      icon: <MousePointer2 className="text-primary" size={24} />,
      title: "Click to Reveal",
      description: "Click on any deal to reveal the code or get taken directly to the discounted product on Amazon."
    },
    {
      icon: <Copy className="text-primary" size={24} />,
      title: "Apply at Checkout",
      description: "Copy the code and paste it at Amazon's checkout page to instantly reduce your total."
    },
    {
      icon: <Wallet className="text-primary" size={24} />,
      title: "Save Money",
      description: "That's it! No sign-up required, no hidden steps — just instant savings."
    }
  ]

  const features = [
    {
      icon: <DollarSign size={24} />,
      title: "100% Free, Always",
      description: "No membership fee, no subscription. Using AzonDeal costs you nothing."
    },
    {
      icon: <ShoppingBag size={24} />,
      title: "Amazon Focused",
      description: "We focus exclusively on Amazon, meaning deeper, more accurate, and more relevant deals for you."
    },
    {
      icon: <ShieldCheck size={24} />,
      title: "Verified & Working Codes",
      description: "Every coupon and promo code is checked before it goes live. No expired or broken codes."
    },
    {
      icon: <RefreshCw size={24} />,
      title: "Daily Updates",
      description: "Our deals are refreshed daily to match Amazon's latest offers, flash sales, and promotions."
    },
    {
      icon: <LayoutGrid size={24} />,
      title: "All Categories Covered",
      description: "Electronics, fashion, kitchen, beauty, books — deals across every Amazon category."
    },
    {
      icon: <UserPlus size={24} />,
      title: "No Account Needed",
      description: "Just visit, grab your code, and save. No registration required to access any deal."
    }
  ]

  const stats = [
    { label: "Monthly Visitors", value: "10,000+" },
    { label: "Active Deals", value: "500+" },
    { label: "Deals Updated", value: "Daily" },
    { label: "Cost to Use", value: "$0" }
  ]

  const offerings = [
    {
      icon: <TicketPercent className="text-orange-500" size={20} />,
      title: "Amazon Promo Codes",
      description: "Exclusive promotional codes directly from Amazon and its sellers, giving you a percentage or flat off-amount at checkout."
    },
    {
      icon: <Tag className="text-blue-500" size={20} />,
      title: "Coupon Codes",
      description: "Verified coupon codes for specific Amazon product categories and brands, ready to copy and apply."
    },
    {
      icon: <Zap className="text-yellow-500" size={20} />,
      title: "Lightning Deals",
      description: "Time-sensitive Amazon deals with deep discounts, highlighted so you can grab them before they expire."
    },
    {
      icon: <Star className="text-purple-500" size={20} />,
      title: "Deal of the Day",
      description: "Amazon's best daily offers, curated and listed in one convenient place on AzonDeal."
    },
    {
      icon: <Grid className="text-green-500" size={20} />,
      title: "Category Deals",
      description: "Browse discounts by category — Electronics, Home & Kitchen, Beauty, Fashion and more."
    }
  ]

  return (
    <main className="min-h-screen bg-white">
      {/* Section 1 — Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden bg-zinc-50/50">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 translate-x-1/4 pointer-events-none" />
        <div className="max-w-[1280px] mx-auto px-4 relative text-center lg:text-left">
          <div className="max-w-4xl mx-auto lg:mx-0">
            <motion.h1 
              {...fadeInUp}
              className="text-3xl sm:text-5xl lg:text-6xl font-black text-zinc-900 mb-6 sm:mb-8 leading-[1.1] tracking-tight"
            >
              The Smartest Way to Shop Amazon — <span className="text-primary">Deals, Promo Codes & Coupons</span>, All in One Place.
            </motion.h1>
            <motion.p 
              {...fadeInUp}
              transition={{ delay: 0.1 }}
              className="text-lg sm:text-xl text-zinc-600 font-medium leading-relaxed max-w-3xl mx-auto lg:mx-0"
            >
              AzonDeal helps you save money on Amazon by bringing you the latest promo codes, coupon codes, and exclusive deals — updated daily, completely free.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Section 2 — Who We Are */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-[1280px] mx-auto px-4">
          <motion.div {...fadeInUp} className="max-w-4xl">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-400 uppercase tracking-[0.2em] mb-6">Who We Are</h2>
            <div className="space-y-6 text-lg sm:text-xl text-zinc-700 leading-relaxed font-medium">
              <p>
                AzonDeal is a free deals and coupon platform dedicated to helping shoppers get the best prices on Amazon. 
                We handpick and verify the latest Amazon promo codes, coupon codes, and lightning deals every day — 
                so you never have to hunt for savings on your own.
              </p>
              <p>
                Whether you're buying electronics, fashion, home essentials, or everyday items on Amazon, 
                AzonDeal makes sure you always pay less than the listed price.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 3 — How It Works */}
      <section className="py-24 bg-zinc-50">
        <div className="max-w-[1280px] mx-auto px-4">
          <motion.div {...fadeInUp} className="mb-16">
            <h2 className="text-2xl font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4">How It Works</h2>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div 
                key={index}
                {...fadeInUp}
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-white rounded-2xl shadow-sm border border-zinc-100 flex items-center justify-center font-black text-xl text-zinc-900 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 mb-3">{step.title}</h3>
                    <p className="text-zinc-600 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 — Why Choose AzonDeal */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-[1280px] mx-auto px-4">
          <motion.div {...fadeInUp} className="mb-12 md:mb-16">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4">Why Choose AzonDeal</h2>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                {...fadeInUp}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-none shadow-sm bg-zinc-50 hover:bg-zinc-100 transition-colors duration-300 rounded-[2rem]">
                  <CardBody className="p-6 sm:p-8">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary mb-6 shadow-sm">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-zinc-900 mb-3">{feature.title}</h3>
                    <p className="text-zinc-500 font-medium text-sm sm:text-base leading-relaxed">{feature.description}</p>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5 — Stats / Social Proof */}
      <section className="bg-zinc-900 py-20 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#ffffff_1px,transparent_1px)] [background-size:40px_40px]" />
        </div>
        <div className="max-w-[1280px] mx-auto px-4 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div 
                key={index} 
                {...fadeInUp}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl sm:text-5xl font-black text-white mb-2">{stat.value}</div>
                <div className="text-zinc-500 text-sm font-bold uppercase tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-zinc-600 text-sm mt-12 italic tracking-tight">
            * Figures based on our latest verified platform data
          </p>
        </div>
      </section>

      {/* Section 6 — Our Mission */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 text-center">
          <motion.div {...fadeInUp} className="max-w-3xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-400 uppercase tracking-[0.2em] mb-8 sm:mb-12 text-left md:text-center">Our Mission</h2>
            <div className="mb-10 sm:mb-12">
              <span className="text-primary text-5xl sm:text-6xl font-serif leading-none select-none">"</span>
              <p className="text-2xl sm:text-4xl font-black text-zinc-900 leading-tight italic -mt-4 sm:-mt-6">
                We believe no one should pay full price on Amazon. AzonDeal exists to make sure you never do.
              </p>
            </div>
            <div className="pt-8 border-t border-zinc-100">
              <h3 className="text-lg sm:text-xl font-black text-zinc-900 mb-4">Mission Statement</h3>
              <p className="text-lg sm:text-xl text-zinc-600 leading-relaxed font-medium">
                Our mission is to be the most reliable and up-to-date Amazon coupon destination on the internet — 
                saving shoppers time, effort, and money on every purchase they make.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 7 — What We Offer */}
      <section className="py-16 md:py-24 bg-zinc-50">
        <div className="max-w-[1280px] mx-auto px-4">
          <motion.div {...fadeInUp} className="mb-12 md:mb-16">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4">What We Offer</h2>
          </motion.div>
          <div className="space-y-4 sm:space-y-6">
            {offerings.map((offering, index) => (
              <motion.div
                key={index}
                {...fadeInUp}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4 sm:gap-6 p-6 sm:p-8 bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-zinc-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-zinc-50 rounded-xl sm:rounded-2xl flex items-center justify-center">
                    {offering.icon}
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-zinc-900 mb-1 sm:mb-2">{offering.title}</h3>
                    <p className="text-zinc-600 text-sm sm:text-base leading-relaxed font-medium">{offering.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 8 — CTA Section */}
      <section className="py-24 bg-white">
        <div className="max-w-[1280px] mx-auto px-4">
          <motion.div 
            {...fadeInUp}
            className="bg-zinc-900 rounded-[3rem] p-8 sm:p-16 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-6">
                Ready to save on your next Amazon order?
              </h2>
              <p className="text-xl text-zinc-400 font-medium mb-10 max-w-2xl mx-auto">
                Browse today's best Amazon promo codes and coupon codes — no sign-up, no hassle. Just pick a deal and start saving.
              </p>
              <Link href="/top-deals">
                <Button 
                  size="lg" 
                  className="bg-primary text-white font-black text-lg px-10 py-8 rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                >
                  Browse All Amazon Deals <ArrowRight className="ml-2" size={24} />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
