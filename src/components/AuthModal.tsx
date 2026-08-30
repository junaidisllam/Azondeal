'use client'

import React, { useState } from 'react'
import { Modal, Button, TextField, Input, Label, Spinner } from "@heroui/react"
import Image from "next/image"
import { Star, ChevronDown, X, Mail, Lock, User, ArrowLeft } from 'lucide-react'
import { signIn } from 'next-auth/react'

interface AuthModalProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  initialMode?: 'login' | 'signup'
}

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48" className="mr-3">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
)

const AuthModal = ({ isOpen, onOpenChange, initialMode = 'signup' }: AuthModalProps) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const [showForm, setShowForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Sync mode with initialMode when isOpen changes to true
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
      setShowForm(false)
      setError(null)
      setName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
    }
  }, [isOpen, initialMode])

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'signup' : 'login')
    setShowForm(false)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (mode === 'signup') {
        // Validation
        if (!name || !email || !password) throw new Error('All fields are required')
        if (password !== confirmPassword) throw new Error('Passwords do not match')

        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Signup failed')

        // If signup success, log them in
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        if (result?.error) throw new Error('Signup successful but login failed. Please login manually.')
        onOpenChange(false)
      } else {
        // Login
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        if (result?.error) throw new Error('Invalid email or password')
        onOpenChange(false)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal>
      <Modal.Backdrop 
        isOpen={isOpen} 
        onOpenChange={onOpenChange}
        variant="blur"
        className="bg-black/60 backdrop-blur-xl"
      >
        <Modal.Container placement="center" size="md" className="p-4 sm:p-6">
          <Modal.Dialog className="bg-white rounded-[32px] sm:rounded-[40px] p-0 shadow-[0_32px_64px_rgba(0,0,0,0.2)] border border-white/20 overflow-hidden max-h-[95vh] w-full sm:max-w-[520px] flex flex-col relative">
            <Modal.CloseTrigger className="absolute right-6 top-6 p-2.5 rounded-full hover:bg-zinc-100 transition-all z-20 bg-white/50 backdrop-blur-md border border-zinc-100 active:scale-90">
              <X size={20} className="text-zinc-500" />
            </Modal.CloseTrigger>
            
            <Modal.Body className="p-8 sm:p-14 flex flex-col items-center text-center overflow-y-auto custom-scrollbar scroll-smooth">
              {/* Back button when form is shown */}
              {showForm && (
                <button 
                  onClick={() => setShowForm(false)}
                  className="absolute left-6 top-6 p-2 rounded-full hover:bg-zinc-100 transition-all flex items-center gap-1.5 text-zinc-500 font-black text-xs sm:text-sm z-20 bg-white/50 backdrop-blur-md border border-zinc-100 active:scale-95"
                >
                  <ArrowLeft size={18} />
                  <span className="hidden sm:inline">Back</span>
                </button>
              )}

              {/* Logo */}
              <div className="mb-8 sm:mb-10 mt-6 sm:mt-0 flex justify-center w-full">
                <Image
                  src="/logo.png"
                  alt="Azon Deal Logo"
                  width={200}
                  height={45}
                  className="object-contain"
                  style={{ height: '36px', width: 'auto' }}
                  priority
                />
              </div>

              {/* Text Content */}
              <div className="space-y-3 mb-10 w-full">
                <h2 className="text-[28px] sm:text-[36px] font-semibold text-zinc-900 leading-none tracking-tight">
                  {mode === 'signup' ? 'Join Azon Deal' : 'Welcome Back'}
                </h2>
                <p className="text-zinc-500 text-[15px] sm:text-[18px] font-medium leading-relaxed max-w-[340px] mx-auto">
                  {mode === 'signup' 
                    ? 'Access thousands of exclusive deals and verified coupons daily' 
                    : 'Log in to manage your saved deals and preferences'}
                </p>
              </div>

              {error && (
                <div className="w-full p-4 mb-6 bg-red-50 text-red-500 text-sm font-semibold rounded-2xl border border-red-100 animate-in fade-in zoom-in-95 duration-200">
                  {error}
                </div>
              )}

              {!showForm ? (
                <div className="w-full flex flex-col items-center">
                  {/* Social Proof (only for signup) */}
                  {mode === 'signup' && (
                    <div className="flex flex-wrap items-center justify-center gap-2 mb-10 bg-zinc-50 py-3 px-6 rounded-2xl border border-zinc-100">
                      <div className="flex -space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill="#FFB800" className="text-[#FFB800]" />
                        ))}
                      </div>
                      <span className="text-zinc-900 font-semibold text-[14px]">4.9/5</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
                      <span className="text-zinc-500 font-semibold text-[13px] uppercase tracking-wider">Trusted by 50k+ Users</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="w-full space-y-4 max-w-[380px]">
                    <Button
                      onPress={async () => {
                        setIsLoading(true)
                        setError(null)
                        try {
                          await signIn('google', { callbackUrl: '/' })
                        } catch (error) {
                          console.error('Google Sign In Error:', error)
                          setError('Failed to connect with Google')
                        } finally {
                          setIsLoading(false)
                        }
                      }}
                      isDisabled={isLoading}
                      className="w-full h-[64px] bg-white hover:bg-zinc-50 text-zinc-800 font-semibold text-[16px] rounded-[22px] border-2 border-zinc-100 shadow-sm flex items-center justify-center transition-all active:scale-[0.98] group"
                    >
                      {isLoading ? (
                        <Spinner size="sm" color="current" className="mr-3" />
                      ) : (
                        <div className="transition-transform group-hover:scale-110 duration-300">
                          <GoogleIcon />
                        </div>
                      )}
                      {isLoading ? 'Establishing Connection...' : 'Continue with Google'}
                    </Button>

                    <div className="pt-6 flex flex-col items-center gap-6">
                      <button 
                        onClick={() => setShowForm(true)}
                        className="text-zinc-400 font-semibold text-[14px] uppercase tracking-widest flex items-center gap-2 hover:text-primary transition-all py-2 group"
                      >
                        {mode === 'signup' ? 'Use Email Address' : 'Email Login'}
                        <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
                      </button>

                      <div className="h-px w-full bg-zinc-100 relative">
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-[12px] font-semibold text-zinc-300 uppercase tracking-widest">OR</span>
                      </div>

                      <p className="text-zinc-500 font-bold text-[15px]">
                        {mode === 'signup' ? 'Already a member?' : "New to Azon Deal?"}{' '}
                        <button 
                          onClick={toggleMode}
                          className="text-primary font-semibold hover:text-primary/80 transition-colors ml-1"
                        >
                          {mode === 'signup' ? 'Log in now' : 'Create account'}
                        </button>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Form View */
                <form onSubmit={handleSubmit} className="w-full max-w-[420px] space-y-6 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {mode === 'signup' && (
                    <TextField isRequired fullWidth className="text-left">
                      <Label className="text-[12px] font-semibold text-zinc-400 uppercase tracking-widest ml-1 mb-2 block">Full Name</Label>
                      <div className="relative group">
                        <Input 
                          placeholder="Your complete name" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-12 h-[60px] rounded-[20px] bg-zinc-50 border-2 border-zinc-100 focus-visible:border-primary focus-visible:bg-white transition-all text-[15px] font-medium"
                        />
                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" />
                      </div>
                    </TextField>
                  )}

                  <TextField isRequired fullWidth className="text-left">
                    <Label className="text-[12px] font-black text-zinc-400 uppercase tracking-widest ml-1 mb-2 block">Email Address</Label>
                    <div className="relative group">
                      <Input 
                        type="email"
                        placeholder="you@example.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-[60px] rounded-[20px] bg-zinc-50 border-2 border-zinc-100 focus-visible:border-primary focus-visible:bg-white transition-all text-[15px] font-bold"
                      />
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" />
                    </div>
                  </TextField>

                  <TextField isRequired fullWidth className="text-left">
                    <Label className="text-[12px] font-black text-zinc-400 uppercase tracking-widest ml-1 mb-2 block">Password</Label>
                    <div className="relative group">
                      <Input 
                        type="password"
                        placeholder="••••••••" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 h-[60px] rounded-[20px] bg-zinc-50 border-2 border-zinc-100 focus-visible:border-primary focus-visible:bg-white transition-all text-[15px] font-bold"
                      />
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" />
                    </div>
                  </TextField>

                  {mode === 'signup' && (
                    <TextField isRequired fullWidth className="text-left">
                      <Label className="text-[12px] font-black text-zinc-400 uppercase tracking-widest ml-1 mb-2 block">Confirm Password</Label>
                      <div className="relative group">
                        <Input 
                          type="password"
                          placeholder="••••••••" 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-12 h-[60px] rounded-[20px] bg-zinc-50 border-2 border-zinc-100 focus-visible:border-primary focus-visible:bg-white transition-all text-[15px] font-bold"
                        />
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" />
                      </div>
                    </TextField>
                  )}

                  <div className="pt-2">
                    <Button 
                      type="submit"
                      isDisabled={isLoading}
                      className="w-full h-[64px] bg-primary text-white font-semibold text-[16px] rounded-[22px] shadow-xl shadow-primary/30 transition-all active:scale-[0.98] hover:shadow-primary/40 flex items-center justify-center"
                    >
                      {isLoading ? <Spinner size="sm" color="current" /> : (mode === 'signup' ? 'Create Free Account' : 'Access Account')}
                    </Button>
                  </div>

                  <div className="pt-4 text-center">
                    <p className="text-zinc-500 font-bold text-[15px]">
                      {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                      <button 
                        type="button"
                        onClick={toggleMode}
                        className="text-primary font-black hover:text-primary/80 transition-colors ml-1"
                      >
                        {mode === 'signup' ? 'Log in' : 'Sign up'}
                      </button>
                    </p>
                  </div>
                </form>
              )}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}

export default AuthModal
