'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Tag, Ghost, Mail, Lock, Sparkles } from 'lucide-react'
import { Button } from "@heroui/button"
import { Card, CardHeader, CardBody } from "@heroui/card"
import { TextField } from "@heroui/react/textfield"
import { Label } from "@heroui/react/label"
import { InputGroup } from "@heroui/react/input-group"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from "next-auth/react"
import Navbar from "@/components/Navbar"
import { Footer } from "@/components/Footer"

export default function AdminForbidden() {
  const [showLogin, setShowLogin] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Shift + A
      if (e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        setShowLogin(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else {
        router.refresh() // Refresh to let AdminLayout re-check session
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center bg-white px-4 relative overflow-hidden pt-20">
        {/* Background Accents */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <AnimatePresence mode="wait">
          {!showLogin ? (
            <motion.div 
              key="404"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="relative text-center max-w-2xl mx-auto"
            >
              {/* Animated Icon */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ 
                  duration: 0.8, 
                  type: "spring",
                  stiffness: 100 
                }}
                className="inline-flex items-center justify-center w-24 h-24 bg-primary/10 text-primary rounded-3xl mb-8 relative"
              >
                <Ghost size={48} />
                <motion.div 
                  animate={{ 
                    y: [0, -8, 0],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2,
                    ease: "easeInOut"
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center text-orange-600 text-[10px] font-black"
                >
                  ?
                </motion.div>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-[120px] font-black text-zinc-900 leading-none tracking-tighter mb-4"
              >
                404
              </motion.h1>

              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-black text-zinc-800 mb-6"
              >
                Lost in the deals?
              </motion.h2>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg text-zinc-500 font-medium mb-12 leading-relaxed"
              >
                The page you're looking for doesn't exist or has been moved to a new home. 
                But don't worry, we have plenty of other ways to save you money!
              </motion.p>

              {/* Action Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Button
                  as={Link}
                  href="/"
                  size="lg"
                  className="bg-primary text-white font-bold h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-2"
                >
                  <Home size={20} />
                  Back to Home
                </Button>
                
                <Button
                  as={Link}
                  href="/brands"
                  variant="ghost"
                  size="lg"
                  className="bg-zinc-100 text-zinc-900 font-bold h-14 px-8 rounded-2xl flex items-center gap-2"
                >
                  <Tag size={20} />
                  Explore Brands
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative w-full max-w-md z-10 py-10"
            >
              <Card 
                className="w-full shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[40px] border-none bg-white overflow-visible"
              >
                <CardHeader className="flex flex-col items-center gap-2 pt-12 pb-6">
                  <div className="w-20 h-20 bg-primary rounded-[28px] flex items-center justify-center shadow-2xl shadow-primary/30 mb-4">
                    <Sparkles size={40} className="text-white" />
                  </div>
                  <h1 className="text-[28px] font-black text-zinc-900 tracking-tighter uppercase">Admin Login</h1>
                  <p className="text-zinc-400 text-[11px] font-black uppercase tracking-[0.2em]">Secure Access Only</p>
                </CardHeader>
                <CardBody className="px-10 pb-12 pt-4">
                  <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                    <div className="space-y-6">
                      <TextField isRequired name="email" value={email} onChange={setEmail}>
                        <Label className="text-zinc-500 font-black uppercase tracking-widest text-[11px] mb-2 ml-1 block">Email Address</Label>
                        <InputGroup className="bg-zinc-50 hover:bg-zinc-100 focus-within:!bg-white border-2 border-transparent focus-within:border-primary/20 h-16 transition-all duration-300 shadow-none rounded-2xl flex items-center">
                          <InputGroup.Prefix className="pl-4 text-zinc-300">
                            <Mail size={20} />
                          </InputGroup.Prefix>
                          <InputGroup.Input 
                            type="email" 
                            placeholder="admin@azondeal.com"
                            className="text-[16px] font-medium placeholder:text-zinc-300 bg-transparent flex-1 outline-none px-3"
                          />
                        </InputGroup>
                      </TextField>

                      <TextField isRequired name="password" value={password} onChange={setPassword}>
                        <Label className="text-zinc-500 font-black uppercase tracking-widest text-[11px] mb-2 ml-1 block">Password</Label>
                        <InputGroup className="bg-zinc-50 hover:bg-zinc-100 focus-within:!bg-white border-2 border-transparent focus-within:border-primary/20 h-16 transition-all duration-300 shadow-none rounded-2xl flex items-center">
                          <InputGroup.Prefix className="pl-4 text-zinc-300">
                            <Lock size={20} />
                          </InputGroup.Prefix>
                          <InputGroup.Input 
                            type="password" 
                            placeholder="••••••••"
                            className="text-[16px] font-medium placeholder:text-zinc-300 bg-transparent flex-1 outline-none px-3"
                          />
                        </InputGroup>
                      </TextField>
                    </div>

                    {error && (
                      <div className="bg-red-50 text-red-500 text-[11px] font-black p-4 rounded-2xl border border-red-100 text-center uppercase tracking-widest">
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      color="primary"
                      size="lg"
                      isLoading={loading}
                      className="h-16 font-black uppercase tracking-[0.2em] mt-4 shadow-xl shadow-primary/20 bg-primary text-white rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                    >
                      Sign In
                    </Button>
                  </form>
                </CardBody>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  )
}
