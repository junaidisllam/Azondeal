'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  MessageSquare, 
  User, 
  Globe,
  CheckCircle2,
  AlertCircle,
  X,
  Brain
} from 'lucide-react'
import { Input, Textarea } from "@heroui/input"
import { Button } from "@heroui/button"
import { Card } from "@heroui/card"
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal"
import { RadioGroup, Radio } from "@heroui/react"

const ContactInfo = [
  {
    icon: <Mail className="text-primary" />,
    title: 'Email Us',
    details: 'support@azondeal.com',
    sub: 'Online support 24/7'
  },
  {
    icon: <MapPin className="text-primary" />,
    title: 'Visit Us',
    details: '123 Tech Avenue, NY',
    sub: 'New York City, USA'
  }
]

export default function ContactPage() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [showToast, setShowToast] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmitAttempt = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.message) {
      alert('Please fill in all required fields.')
      return
    }
    onOpen() // Open Verification Modal
  }

  const handleVerifyAndSubmit = async () => {
    if (selectedAnswer !== 'fma') {
      alert('Wrong answer! Please select the correct law of motion.')
      return
    }

    onClose()
    setFormState('submitting')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setFormState('success')
        setShowToast(true)
        setFormData({ name: '', email: '', subject: '', message: '' })
        setSelectedAnswer('')
        setTimeout(() => setShowToast(false), 5000)
      } else {
        throw new Error('Failed to send message')
      }
    } catch (err) {
      setFormState('error')
      setErrorMessage('Something went wrong. Please try again.')
    } finally {
      setFormState('idle')
    }
  }

  return (
    <main className="min-h-screen bg-[#F9FAFB] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none -z-10" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Custom Toaster */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 20, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md"
          >
            <div className="bg-white border border-green-100 shadow-2xl rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle2 className="text-green-600" size={24} />
              </div>
              <div className="flex-1">
                <h4 className="text-zinc-900 font-bold text-sm">Message Sent!</h4>
                <p className="text-zinc-500 text-xs">We will get back to you shortly.</p>
              </div>
              <button onClick={() => setShowToast(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1280px] mx-auto px-4 py-8 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] mb-4 sm:mb-6"
          >
            <Globe size={10} className="text-primary" />
            <span>Get in touch</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-black text-zinc-900 mb-4 sm:mb-6 tracking-tight leading-tight"
          >
            Let&apos;s Start a <span className="text-primary italic">Conversation</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-500 text-base sm:text-xl font-medium leading-relaxed"
          >
            Have a question or proposal? We&apos;d love to hear from you. 
            Our team is always ready to help.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 sm:gap-16 items-start">
          {/* Info Cards */}
          <div className="lg:col-span-5 space-y-6 sm:space-y-8">
            <div className="grid gap-6">
              {ContactInfo.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                >
                  <Card className="p-5 sm:p-6 border border-zinc-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl sm:rounded-3xl">
                    <div className="flex items-start gap-4 sm:gap-6">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="text-zinc-900 font-bold text-base sm:text-lg mb-0.5 sm:mb-1">{item.title}</h3>
                        <p className="text-zinc-900 font-black text-lg sm:text-xl mb-0.5 sm:mb-1 break-all">{item.details}</p>
                        <p className="text-zinc-400 font-medium text-[10px] sm:text-sm uppercase tracking-wider">{item.sub}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-7 bg-white p-6 sm:p-12 rounded-[32px] sm:rounded-[40px] shadow-2xl shadow-zinc-200/50 border border-zinc-100 relative"
          >
            <form onSubmit={handleSubmitAttempt} className="space-y-8">
              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-zinc-900 font-bold text-sm ml-1 block">Your Name</label>
                  <Input
                    suppressHydrationWarning
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                    variant="flat"
                    classNames={{
                      input: "h-12 sm:h-14 font-medium",
                      inputWrapper: "h-12 sm:h-14 bg-zinc-50 rounded-xl sm:rounded-2xl border border-zinc-100 hover:border-primary transition-colors px-4"
                    }}
                    startContent={<User size={18} className="text-zinc-400 mr-2" />}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-zinc-900 font-bold text-sm ml-1 block">Email Address</label>
                  <Input
                    suppressHydrationWarning
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    variant="flat"
                    classNames={{
                      input: "h-12 sm:h-14 font-medium",
                      inputWrapper: "h-12 sm:h-14 bg-zinc-50 rounded-xl sm:rounded-2xl border border-zinc-100 hover:border-primary transition-colors px-4"
                    }}
                    startContent={<Mail size={18} className="text-zinc-400 mr-2" />}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-zinc-900 font-bold text-sm ml-1 block">Subject</label>
                <Input
                  suppressHydrationWarning
                  name="subject"
                  placeholder="How can we help?"
                  value={formData.subject}
                  onChange={handleInputChange}
                  variant="flat"
                  classNames={{
                    input: "h-12 sm:h-14 font-medium",
                    inputWrapper: "h-12 sm:h-14 bg-zinc-50 rounded-xl sm:rounded-2xl border border-zinc-100 hover:border-primary transition-colors px-4"
                  }}
                  startContent={<MessageSquare size={18} className="text-zinc-400 mr-2" />}
                />
              </div>

              <div className="space-y-3">
                <label className="text-zinc-900 font-bold text-sm ml-1 block">Message</label>
                <Textarea
                  suppressHydrationWarning
                  name="message"
                  placeholder="Write your message here..."
                  value={formData.message}
                  onChange={handleInputChange}
                  variant="flat"
                  minRows={6}
                  classNames={{
                    input: "font-medium py-2",
                    inputWrapper: "bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-primary transition-colors p-4"
                  }}
                />
              </div>

              <Button
                type="submit"
                isLoading={formState === 'submitting'}
                className="w-full h-16 bg-zinc-900 text-white font-black text-lg rounded-2xl shadow-xl shadow-zinc-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {formState === 'submitting' ? 'Processing...' : 'Send Message'}
                <Send size={20} className="ml-2" />
              </Button>

              {formState === 'error' && (
                <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold">
                  <AlertCircle size={18} />
                  <span>{errorMessage}</span>
                </div>
              )}
            </form>
          </motion.div>
        </div>
      </div>

      {/* Verification Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        placement="center"
        backdrop="blur"
        classNames={{
          base: "rounded-[32px] border border-zinc-200 p-2 bg-white shadow-2xl",
          header: "border-b-0",
          footer: "border-t-0",
          backdrop: "bg-zinc-900/50 backdrop-blur-md"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-center">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <Brain className="text-primary" size={32} />
                </div>
                <h2 className="text-2xl font-black text-zinc-900">Human Verification</h2>
                <p className="text-zinc-500 text-sm font-medium">To keep it spam-free, please answer this simple question:</p>
              </ModalHeader>
              <ModalBody className="py-6">
                <div className="bg-zinc-50 p-6 rounded-2xl mb-6">
                  <p className="text-zinc-900 font-bold text-lg text-center mb-6">What is Newton&apos;s second law of motion?</p>
                  
                  <div className="flex flex-col gap-4">
                    {[
                      { id: 'rest', label: "An object at rest stays at rest" },
                      { id: 'fma', label: "F = ma (Force = Mass \u00D7 Acceleration)" },
                      { id: 'reaction', label: "Every action has an equal reaction" },
                      { id: 'relativity', label: "E = mc\u00B2" }
                    ].map((option) => (
                      <div 
                        key={option.id}
                        onClick={() => setSelectedAnswer(option.id)}
                        className={`
                          group relative flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200
                          ${selectedAnswer === option.id 
                            ? 'border-primary bg-primary/5 shadow-sm' 
                            : 'border-zinc-100 bg-zinc-50/50 hover:bg-zinc-100 hover:border-zinc-200'}
                        `}
                      >
                        <span className={`font-medium text-sm transition-colors ${selectedAnswer === option.id ? 'text-zinc-900' : 'text-zinc-600'}`}>
                          {option.label}
                        </span>
                        
                        <div className={`
                          w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                          ${selectedAnswer === option.id ? 'border-primary bg-white' : 'border-zinc-300 bg-white'}
                        `}>
                          {selectedAnswer === option.id && (
                            <motion.div 
                              layoutId="active-dot"
                              className="w-3 h-3 rounded-full bg-primary"
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ModalBody>
              <ModalFooter className="flex flex-col gap-3">
                <Button 
                  color="primary" 
                  isDisabled={!selectedAnswer}
                  className={`w-full h-14 rounded-xl font-bold text-lg shadow-xl shadow-primary/20 ${!selectedAnswer ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onPress={handleVerifyAndSubmit}
                >
                  Verify & Send
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full h-14 rounded-xl font-bold text-zinc-400"
                  onPress={onClose}
                >
                  Cancel
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </main>
  )
}
