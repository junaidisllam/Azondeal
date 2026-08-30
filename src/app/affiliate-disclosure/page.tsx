'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  ShieldCheck, 
  Info, 
  ShoppingBag, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Zap,
  DollarSign
} from 'lucide-react'
import { Card, CardBody } from "@heroui/card"
import { Button } from "@heroui/button"
import Link from 'next/link'

export default function AffiliateDisclosurePage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  }

  const programs = [
    {
      title: "Amazon Associates",
      description: "AzonDeal is a participant in the Amazon Associates Program, an affiliate advertising program designed to provide a means for sites to earn fees by advertising and linking to Amazon.com and affiliated sites.",
      detail: "When you purchase through our Amazon links, we may earn a commission at no extra cost to you.",
      color: "bg-orange-50",
      iconColor: "text-orange-500"
    },
    {
      title: "Walmart Affiliate",
      description: "We participate in the Walmart Affiliate Program. This means we may earn referral fees when you make qualifying purchases through our links to Walmart.",
      detail: "In compliance with program terms, we clearly disclose that our content includes affiliate links.",
      color: "bg-blue-50",
      iconColor: "text-blue-500"
    },
    {
      title: "Partner Networks",
      description: "AzonDeal also partners with the eBay Partner Network, Target Affiliates, ShareASale, CJ Affiliate, and similar programs.",
      detail: "We strive to clearly label or disclose all affiliate relationships to maintain your trust.",
      color: "bg-purple-50",
      iconColor: "text-purple-500"
    }
  ]

  const userBenefits = [
    {
      icon: <DollarSign className="text-green-500" size={24} />,
      title: "Zero Extra Cost",
      text: "The price you pay is the same whether you use our link or go directly to the store."
    },
    {
      icon: <CheckCircle2 className="text-primary" size={24} />,
      title: "Manual Verification",
      text: "Every deal is hand-checked by our team to ensure it works before we post it."
    },
    {
      icon: <ShieldCheck className="text-blue-500" size={24} />,
      title: "Transparency First",
      text: "We follow FTC guidelines and clearly disclose our relationships with retailers."
    }
  ]

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-24 bg-zinc-50 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 translate-x-1/4 pointer-events-none" />
        <div className="max-w-[1280px] mx-auto px-4 relative text-center">
          <motion.div {...fadeInUp} className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full font-bold text-sm mb-8">
              <ShieldCheck size={18} />
              <span>Transparency & Trust</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-zinc-900 mb-6 tracking-tight leading-none">
              Affiliate <span className="text-primary">Disclosure</span>
            </h1>
            <p className="text-xl text-zinc-600 font-medium leading-relaxed">
              At AzonDeal, we believe in radical transparency. 
              Our goal is to help you save money, and here is exactly how we keep our service free for everyone.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick Summary */}
      <section className="py-20 border-b border-zinc-100">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {userBenefits.map((benefit, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col items-center text-center p-8 bg-zinc-50/50 rounded-[2rem]"
              >
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-black text-zinc-900 mb-3">{benefit.title}</h3>
                <p className="text-zinc-500 font-medium leading-relaxed">{benefit.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-24">
            
            {/* General Disclaimer */}
            <motion.div {...fadeInUp} className="prose prose-zinc prose-lg max-w-none">
              <h2 className="text-3xl font-black text-zinc-900 mb-8 flex items-center gap-4">
                <Info className="text-primary" size={32} />
                General Disclosure
              </h2>
              <div className="space-y-6 text-zinc-600 font-medium leading-relaxed">
                <p>
                  AzonDeal routinely contains third-party advertising and links to external third-party websites. By providing advertising and links to other sites, AzonDeal does not guarantee, approve, or endorse the information or products available at these sites.
                </p>
                <p>
                  A link or advertising placement on AzonDeal does not indicate any association with, sponsorship by, or endorsement of AzonDeal by the linked site or advertiser. We have no control over and make no warranty regarding the quality, safety, or legality of any products or services at external sites.
                </p>
                <div className="p-6 bg-zinc-50 rounded-2xl border-l-4 border-primary italic">
                  "You are solely responsible for evaluating any offer, product, or promotion listed on AzonDeal and for understanding the terms and conditions that apply."
                </div>
              </div>
            </motion.div>

            {/* Program Grid */}
            <div className="space-y-12">
              <div className="text-center">
                <h2 className="text-3xl font-black text-zinc-900 mb-4">Affiliate Programs</h2>
                <p className="text-zinc-500 font-medium">We partner with major retailers to bring you the best deals.</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {programs.map((program, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className={program.color + " border-none shadow-none rounded-[2.5rem] h-full"}>
                      <CardBody className="p-8 flex flex-col">
                        <div className={"w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-6 " + program.iconColor}>
                          <ShoppingBag size={24} />
                        </div>
                        <h3 className="text-xl font-black text-zinc-900 mb-4">{program.title}</h3>
                        <p className="text-zinc-700 text-sm leading-relaxed mb-6 flex-1">
                          {program.description}
                        </p>
                        <div className="pt-6 border-t border-zinc-200/50">
                          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Zap size={12} className="text-primary" />
                            The Result
                          </p>
                          <p className="text-xs font-medium text-zinc-600">
                            {program.detail}
                          </p>
                        </div>
                      </CardBody>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Transparency Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-zinc-900 text-white rounded-[3rem] p-12 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="relative z-10">
                <h2 className="text-3xl font-black mb-8">Link & Advertising Transparency</h2>
                <div className="grid md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <p className="text-zinc-400 font-medium leading-relaxed">
                      Whenever possible, affiliate links and sponsored content are clearly identified as such. AzonDeal adheres to truth-in-advertising principles.
                    </p>
                    <p className="text-zinc-400 font-medium leading-relaxed">
                      We follow the U.S. Federal Trade Commission (FTC) guidelines, which require that affiliate relationships be clearly and conspicuously disclosed to maintain trust and legal compliance.
                    </p>
                  </div>
                  <div className="space-y-6 bg-white/5 p-8 rounded-[2rem] border border-white/10">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary shrink-0">
                        <AlertCircle size={20} />
                      </div>
                      <p className="text-sm font-medium leading-relaxed">
                        By using AzonDeal, you acknowledge that any reliance on content provided, or through affiliate links, is at your own risk.
                      </p>
                    </div>
                    <Link href="/contact">
                      <Button className="w-full bg-white text-zinc-900 font-black h-14 rounded-2xl mt-4">
                        Questions? Contact Us
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ-style Note */}
      <section className="py-24 bg-zinc-50/50">
        <div className="max-w-[1280px] mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <HelpCircle className="text-zinc-300 mx-auto mb-6" size={48} />
            <h2 className="text-2xl font-black text-zinc-900 mb-6">Still confused about how this works?</h2>
            <p className="text-zinc-500 font-medium mb-10 leading-relaxed">
              We've detailed everything about our operations in our <Link href="/faq" className="text-primary underline">FAQ section</Link>. 
              Our goal is to be the most trusted deal discovery platform on the web.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
