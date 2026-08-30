'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Rocket, 
  Search as SearchIcon, 
  UserCircle, 
  ShoppingBag, 
  Mail, 
  MessageCircle,
  ChevronDown,
  Info,
  HelpCircle
} from 'lucide-react'
import { Accordion, cn } from "@heroui/react"
import { Button } from "@heroui/button"
import { Card, CardBody } from "@heroui/card"
import Link from 'next/link'

const faqData = [
  {
    category: "Getting Started",
    icon: <Rocket className="text-primary" size={24} />,
    items: [
      {
        question: "What is AzonDeal?",
        answer: "AzonDeal is a free deals and coupon platform dedicated to helping shoppers get the best prices on Amazon. We handpick and verify the latest Amazon promo codes, coupon codes, and lightning deals every day — so you never have to hunt for savings on your own."
      },
      {
        question: "How do I create an account?",
        answer: "Creating an account is simple! Just click the 'Signup' button in the top navigation bar, enter your email and password, and you're ready to start saving and tracking your favorite deals."
      },
      {
        question: "Is AzonDeal free to use?",
        answer: "Yes, AzonDeal is 100% free to use. There are no membership fees, no hidden costs, and no subscriptions. Our mission is to help you save money on every Amazon purchase without any barriers."
      }
    ]
  },
  {
    category: "Finding Deals",
    icon: <SearchIcon className="text-blue-500" size={24} />,
    items: [
      {
        question: "How do I search for specific deals?",
        answer: "You can use the search bar at the top of any page to search for products, brands, or categories. You can also browse through our categories or filter by discount percentage and price range on our Explore page."
      },
      {
        question: "How often are deals updated?",
        answer: "Our team and systems work 24/7 to bring you real-time updates. We refresh our deal database every few minutes to ensure that you have access to the latest lightning deals and promo codes as soon as they go live."
      }
    ]
  },
  {
    category: "Account & Settings",
    icon: <UserCircle className="text-purple-500" size={24} />,
    items: [
      {
        question: "How do I save deals for later?",
        answer: "When you find a deal you like, simply click the heart icon (Like) on the deal card. You can view all your saved deals by clicking on your profile icon in the navigation bar."
      },
      {
        question: "How do I delete my account?",
        answer: "We're sorry to see you go! If you'd like to delete your account and all associated data, please contact our support team at support@azondeal.com, and we will process your request within 24 hours."
      }
    ]
  },
  {
    category: "Shopping & Purchases",
    icon: <ShoppingBag className="text-green-500" size={24} />,
    items: [
      {
        question: "Do I buy products directly from AzonDeal?",
        answer: "No, AzonDeal is a discovery platform. When you click on a deal, we provide you with the promo code and redirect you to the official Amazon product page where you complete your purchase securely."
      },
      {
        question: "What if a deal doesn't work?",
        answer: "While we manually verify every deal, some codes may expire earlier than expected due to high demand. If a deal isn't working, please click the 'Report' button on the deal card so our team can investigate and update the listing."
      }
    ]
  }
]

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredFaq = useMemo(() => {
    if (!searchQuery.trim()) return faqData
    
    return faqData.map(category => ({
      ...category,
      items: category.items.filter(item => 
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(category => category.items.length > 0)
  }, [searchQuery])

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-12 md:py-20 bg-zinc-50/50 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 translate-x-1/4 pointer-events-none" />
        <div className="max-w-[1280px] mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div {...fadeInUp}>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-zinc-900 mb-6 tracking-tight">
                Frequently Asked <span className="text-primary">Questions</span>
              </h1>
              <p className="text-lg sm:text-xl text-zinc-600 font-medium mb-10">
                Everything you need to know about AzonDeal and saving on Amazon.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="max-w-xl mx-auto"
            >
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 z-10 text-zinc-400 group-focus-within:text-primary transition-colors">
                  <SearchIcon size={20} />
                </div>
                <input
                  type="text"
                  placeholder="Search FAQ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-14 pl-14 pr-6 bg-white border border-zinc-100 rounded-2xl shadow-xl shadow-zinc-200/50 outline-none focus:border-primary transition-all text-zinc-700 font-medium placeholder:text-zinc-400"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-20">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {filteredFaq.length > 0 ? (
              <div className="space-y-12">
                {filteredFaq.map((category, catIdx) => (
                  <motion.div 
                    key={catIdx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: catIdx * 0.1 }}
                  >
                    <div className="flex items-center gap-4 mb-6 px-2">
                      <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center shadow-sm">
                        {category.icon}
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-zinc-900">{category.category}</h2>
                        <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">{category.items.length} Items</span>
                      </div>
                    </div>

                    <Accordion 
                      className="bg-white border border-zinc-100 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-sm"
                      variant="surface"
                    >
                      {category.items.map((item, itemIdx) => (
                        <Accordion.Item 
                          key={itemIdx}
                          id={`${catIdx}-${itemIdx}`}
                          className="border-b last:border-b-0 border-zinc-100 group/item"
                        >
                          <Accordion.Heading>
                            <Accordion.Trigger className="px-5 sm:px-8 py-5 sm:py-6 hover:bg-zinc-50/50 transition-colors flex items-center gap-4">
                              <span className="flex-1 text-left text-base sm:text-lg font-bold text-zinc-800 group-hover/item:text-primary transition-colors">
                                {item.question}
                              </span>
                              <Accordion.Indicator className="text-zinc-400">
                                <ChevronDown size={20} />
                              </Accordion.Indicator>
                            </Accordion.Trigger>
                          </Accordion.Heading>
                          <Accordion.Panel>
                            <Accordion.Body className="px-5 sm:px-8 pb-6 sm:pb-8 text-zinc-600 text-sm sm:text-[17px] leading-relaxed font-medium bg-zinc-50/30">
                              {item.answer}
                            </Accordion.Body>
                          </Accordion.Panel>
                        </Accordion.Item>
                      ))}
                    </Accordion>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-300">
                  <HelpCircle size={40} />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 mb-2">No results found</h3>
                <p className="text-zinc-500">We couldn't find any answers matching "{searchQuery}"</p>
                <Button 
                  variant="ghost" 
                  className="mt-6 text-primary font-bold"
                  onPress={() => setSearchQuery("")}
                >
                  Clear search
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-24 bg-zinc-50">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="rounded-[3rem] border-none shadow-xl shadow-zinc-200/50 overflow-hidden">
              <CardBody className="p-0">
                <div className="grid md:grid-cols-2">
                  <div className="p-12 bg-zinc-900 text-white flex flex-col justify-center">
                    <h2 className="text-2xl sm:text-3xl font-black mb-4 sm:mb-6">Still have questions?</h2>
                    <p className="text-zinc-400 text-base sm:text-lg font-medium mb-6 sm:mb-8">
                      Can't find the answer you're looking for? Please chat with our friendly team.
                    </p>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-zinc-300">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                          <Mail size={20} className="text-primary" />
                        </div>
                        <span className="font-bold">support@azondeal.com</span>
                      </div>
                      <div className="flex items-center gap-4 text-zinc-300">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                          <MessageCircle size={20} className="text-primary" />
                        </div>
                        <span className="font-bold">Live chat available 24/7</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-12 bg-white flex flex-col justify-center items-center text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
                      <Info size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-zinc-900 mb-4">Contact Support</h3>
                    <p className="text-zinc-500 font-medium mb-8">
                      Our support team is here to help you with any platform issues or questions.
                    </p>
                    <div className="flex flex-col w-full gap-3">
                      <Button 
                        className="bg-primary text-white font-black h-14 rounded-2xl shadow-lg shadow-primary/20"
                        size="lg"
                      >
                        Email Support
                      </Button>
                      <Button 
                        variant="bordered"
                        className="border-zinc-200 text-zinc-700 font-bold h-14 rounded-2xl"
                        size="lg"
                      >
                        Contact Form
                      </Button>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}
