'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Shield, Lock, Eye, FileText, ChevronRight } from 'lucide-react'

export default function PrivacyPolicyPage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  }

  const sections = [
    {
      title: "What information do we collect?",
      content: (
        <>
          <h4 className="font-bold text-zinc-900 mt-4 mb-2">Personal information you disclose to us</h4>
          <p className="mb-4 text-zinc-600">
            <strong>In Short:</strong> We collect information that you provide to us.
          </p>
          <p className="mb-4 text-zinc-600">
            We collect personal information that you voluntarily provide to us when you register on the Site, express an interest in obtaining information about us or our products and services, when you participate in activities on the Site (such as by posting messages in our online forums or entering competitions, contests or giveaways) or otherwise when you contact us.
          </p>
          <h4 className="font-bold text-zinc-900 mt-4 mb-2">Social Media Login Data</h4>
          <p className="mb-4 text-zinc-600">
            We may provide you with the option to register with us using your existing social media account details, like your Facebook, Twitter or other social media account. If you choose to register in this way, we will collect the information described in the section called "HOW DO WE HANDLE YOUR SOCIAL LOGINS" below.
          </p>
        </>
      )
    },
    {
      title: "How do we use your information?",
      content: (
        <>
          <p className="mb-4 text-zinc-600">
            <strong>In Short:</strong> We process your information for purposes based on legitimate business interests, the fulfillment of our contract with you, compliance with our legal obligations, and/or your consent.
          </p>
          <p className="mb-4 text-zinc-600">
            We use personal information collected via our Site for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
          </p>
        </>
      )
    },
    {
      title: "Will your information be shared with anyone?",
      content: (
        <>
          <p className="mb-4 text-zinc-600">
            <strong>In Short:</strong> We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.
          </p>
          <p className="mb-4 text-zinc-600">
            We may process or share your data that we hold based on the following legal basis: Consent, Legitimate Interests, Performance of a Contract, Legal Obligations, and Vital Interests.
          </p>
        </>
      )
    },
    {
      title: "Do we use cookies and other tracking technologies?",
      content: (
        <>
          <p className="mb-4 text-zinc-600">
            <strong>In Short:</strong> We may use cookies and other tracking technologies to collect and store your information.
          </p>
          <p className="mb-4 text-zinc-600">
            We may use cookies and similar tracking technologies (like web beacons and pixels) to access or store information. Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Notice.
          </p>
        </>
      )
    },
    {
      title: "How do we handle your social logins?",
      content: (
        <>
          <p className="mb-4 text-zinc-600">
            <strong>In Short:</strong> If you choose to register or log in to our websites using a social media account, we may have access to certain information about you.
          </p>
          <p className="mb-4 text-zinc-600">
            Our Site offers you the ability to register and login using your third-party social media account details. Where you choose to do this, we will receive certain profile information about you from your social media provider.
          </p>
        </>
      )
    },
    {
      title: "How long do we keep your information?",
      content: (
        <>
          <p className="mb-4 text-zinc-600">
            <strong>In Short:</strong> We keep your information for as long as necessary to fulfill the purposes outlined in this privacy notice unless otherwise required by law.
          </p>
        </>
      )
    },
    {
      title: "How do we keep your information safe?",
      content: (
        <>
          <p className="mb-4 text-zinc-600">
            <strong>In Short:</strong> We aim to protect your personal information through a system of organizational and technical security measures.
          </p>
        </>
      )
    },
    {
      title: "What are your privacy rights?",
      content: (
        <>
          <p className="mb-4 text-zinc-600">
            <strong>In Short:</strong> You may review, change, or terminate your account at any time.
          </p>
        </>
      )
    },
    {
      title: "Do California residents have specific privacy rights?",
      content: (
        <>
          <p className="mb-4 text-zinc-600">
            <strong>In Short:</strong> Yes, if you are a resident of California, you are granted specific rights regarding access to your personal information.
          </p>
        </>
      )
    },
    {
      title: "How can you contact us about this notice?",
      content: (
        <>
          <p className="mb-4 text-zinc-600">
            If you have questions or comments about this notice, you may email us at <strong>support@azondeal.com</strong>.
          </p>
        </>
      )
    }
  ]

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 bg-zinc-50 overflow-hidden border-b border-zinc-100">
        <div className="absolute top-0 right-0 w-1/4 h-full bg-primary/5 -skew-x-12 translate-x-1/4 pointer-events-none" />
        <div className="max-w-[1280px] mx-auto px-4 relative">
          <div className="max-w-3xl">
            <motion.div {...fadeInUp}>
              <div className="flex items-center gap-3 text-primary font-bold uppercase tracking-widest text-[10px] sm:text-sm mb-4 sm:mb-6">
                <Shield size={18} />
                <span>Legal Document</span>
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-zinc-900 mb-6 tracking-tight leading-tight">
                Privacy <span className="text-primary">Policy</span>
              </h1>
              <p className="text-lg sm:text-xl text-zinc-600 font-medium max-w-2xl leading-relaxed">
                Thank you for choosing to be part of our community at AzonDeal. 
                We are committed to protecting your personal information and your right to privacy.
              </p>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-8 sm:mt-10 text-[11px] sm:text-sm font-bold text-zinc-400">
                <span className="flex items-center gap-2">
                  <FileText size={14} />
                  Last Updated: May 2026
                </span>
                <span className="flex items-center gap-2">
                  <Lock size={14} />
                  Version 1.0
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-24">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-16">
            
            {/* Table of Contents - Desktop Only */}
            <div className="hidden lg:block lg:col-span-3 sticky top-24 h-fit">
              <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-6">In this document</h3>
              <nav className="space-y-4">
                {sections.map((section, idx) => (
                  <button 
                    key={idx}
                    className="flex items-center gap-2 text-zinc-600 hover:text-primary font-bold text-sm transition-colors text-left"
                    onClick={() => {
                      const el = document.getElementById(`section-${idx}`)
                      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }}
                  >
                    <ChevronRight size={14} className="opacity-0 hover:opacity-100" />
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-9 max-w-3xl">
              <article className="prose prose-zinc prose-lg prose-headings:font-black prose-headings:tracking-tight prose-headings:text-zinc-900 max-w-none">
                <motion.div {...fadeInUp} transition={{ delay: 0.1 }}>
                  <p className="text-lg leading-relaxed text-zinc-600 mb-12">
                    AzonDeal (“we”, “us”, or “our”) is committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us at <span className="text-primary font-bold">support@azondeal.com</span>.
                  </p>
                  <p className="text-lg leading-relaxed text-zinc-600 mb-12">
                    When you use any AzonDeal website, mobile site, media form, or application (the "Site"), we appreciate that you are trusting us with your personal information. We take your privacy very seriously. In this privacy notice, we seek to explain to you in the clearest way possible what information we collect, how we use it and what rights you have in relation to it.
                  </p>
                </motion.div>

                {sections.map((section, idx) => (
                  <motion.section 
                    key={idx}
                    id={`section-${idx}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-10 sm:mb-16 pb-10 sm:pb-16 border-b border-zinc-100 last:border-0"
                  >
                    <h2 className="text-xl sm:text-2xl font-black text-zinc-900 mb-4 sm:mb-6 flex items-center gap-3 sm:gap-4">
                      <span className="flex items-center justify-center min-w-[32px] w-8 h-8 rounded-lg bg-zinc-900 text-white text-[10px] sm:text-xs font-bold">
                        {idx + 1}
                      </span>
                      {section.title}
                    </h2>
                    <div className="text-zinc-600 leading-relaxed font-medium">
                      {section.content}
                    </div>
                  </motion.section>
                ))}
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* Help Banner */}
      <section className="py-24 bg-zinc-900 text-white">
        <div className="max-w-[1280px] mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-8 text-primary">
              <Eye size={32} />
            </div>
            <h2 className="text-3xl font-black mb-6">Transparent. Secure. Private.</h2>
            <p className="text-zinc-400 text-lg mb-10">
              We update this notice as necessary to stay compliant with relevant laws and ensure your data is always protected.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="px-6 py-4 bg-white/5 rounded-2xl border border-white/10 font-bold">
                Version: 1.0.4
              </div>
              <div className="px-6 py-4 bg-white/5 rounded-2xl border border-white/10 font-bold">
                Last Review: May 5, 2026
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
