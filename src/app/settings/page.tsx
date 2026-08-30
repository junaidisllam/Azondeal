'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Avatar, 
  Button, 
  Input, 
  Card, 
  Spinner,
  Switch
} from "@heroui/react"
import { Tabs, Tab } from "@heroui/tabs"
import { 
  User, 
  Mail, 
  Shield, 
  Bell, 
  Camera,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  })

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || "",
        email: session.user.email || "",
      })
    }
  }, [session])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Spinner size="lg" color="current" className="text-primary" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
        <Card className="max-w-[400px] p-10 rounded-[32px] text-center border-none shadow-xl shadow-zinc-200/50">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-semibold text-zinc-900 mb-2">Access Denied</h2>
          <p className="text-zinc-500 font-medium mb-8">Please log in to your account to access settings and manage your profile.</p>
          <Button 
            variant="primary" 
            className="w-full h-14 rounded-2xl font-semibold text-base shadow-lg shadow-primary/20"
            onPress={() => window.location.href = '/'}
          >
            Return to Home
          </Button>
        </Card>
      </div>
    )
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccessMessage("")

    setTimeout(() => {
      setIsLoading(false)
      setSuccessMessage("Profile updated successfully!")
      setTimeout(() => setSuccessMessage(""), 3000)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 pt-10 pb-20 px-4 sm:px-6">
      <div className="max-w-[1000px] mx-auto">
        
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-semibold text-zinc-900 tracking-tight">Account Settings</h1>
          <p className="text-zinc-500 font-medium mt-1">Manage your profile, security, and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-8 rounded-[32px] border-none shadow-xl shadow-zinc-200/40 bg-white">
              <div className="flex flex-col items-center text-center">
                <div className="relative group mb-6">
                  <div className="w-32 h-32 rounded-full ring-4 ring-zinc-50 shadow-lg overflow-hidden bg-zinc-100 flex items-center justify-center">
                    {session?.user?.image ? (
                      <img 
                        src={session.user.image} 
                        alt={session.user.name || "Profile"} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user?.name || "U")}&size=128&background=random&color=fff`
                        }}
                      />
                    ) : (
                      <span className="text-4xl font-semibold text-zinc-400">
                        {session?.user?.name?.substring(0, 1) || "U"}
                      </span>
                    )}
                  </div>
                  <button className="absolute bottom-1 right-1 p-2.5 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform active:scale-95 border-4 border-white">
                    <Camera size={18} />
                  </button>
                </div>
                <h3 className="text-xl font-semibold text-zinc-900">{session?.user?.name || "Member"}</h3>
                <p className="text-zinc-400 font-medium text-sm mt-1">{session?.user?.email}</p>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Tabs 
              variant="underlined" 
              className="w-full"
              classNames={{
                base: "w-full border-b border-zinc-200 mb-8",
                tabList: "gap-8 px-0",
                cursor: "w-full bg-primary h-1 rounded-full",
                tab: "h-12 px-0 text-base font-semibold text-zinc-400 data-[selected=true]:text-primary",
              }}
            >
              <Tab 
                key="profile" 
                title={
                  <div className="flex items-center gap-2">
                    <User size={18} />
                    <span>Profile</span>
                  </div>
                }
              >
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pt-4">
                  <Card className="p-8 rounded-[32px] border-none shadow-xl shadow-zinc-200/40 bg-white">
                    <h4 className="text-lg font-semibold text-zinc-900 mb-6">Personal Information</h4>
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest ml-1">Full Name</label>
                          <Input 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="John Doe"
                            className="h-[56px] rounded-2xl border-2 border-zinc-100 focus:border-primary transition-all font-medium text-base px-4 w-full outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest ml-1">Email Address</label>
                          <div className="relative">
                            <Input 
                              value={formData.email}
                              disabled
                              placeholder="john@example.com"
                              className="h-[56px] rounded-2xl border-2 border-zinc-100 bg-zinc-50 opacity-80 font-medium text-base pl-12 w-full outline-none cursor-not-allowed"
                            />
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                          </div>
                        </div>
                      </div>
                      <div className="pt-4 flex justify-end">
                        <Button type="submit" variant="primary" isPending={isLoading} className="h-14 px-10 rounded-2xl font-semibold shadow-lg shadow-primary/20">
                          Save Changes
                        </Button>
                      </div>
                      {successMessage && (
                        <div className="bg-green-50 text-green-600 p-4 rounded-2xl flex items-center gap-3 font-medium text-sm border border-green-100 mt-4">
                          <CheckCircle2 size={18} /> {successMessage}
                        </div>
                      )}
                    </form>
                  </Card>
                </motion.div>
              </Tab>

              <Tab 
                key="security" 
                title={
                  <div className="flex items-center gap-2">
                    <Shield size={18} />
                    <span>Security</span>
                  </div>
                }
              >
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4">
                  <Card className="p-8 rounded-[32px] border-none shadow-xl shadow-zinc-200/40 bg-white">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h4 className="text-lg font-semibold text-zinc-900">Two-Factor Authentication</h4>
                        <p className="text-sm text-zinc-500 font-medium mt-1">Add an extra layer of security</p>
                      </div>
                      <Switch defaultSelected />
                    </div>
                  </Card>
                </motion.div>
              </Tab>

              <Tab 
                key="notifications" 
                title={
                  <div className="flex items-center gap-2">
                    <Bell size={18} />
                    <span>Notifications</span>
                  </div>
                }
              >
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4">
                  <Card className="p-8 rounded-[32px] border-none shadow-xl shadow-zinc-200/40 bg-white space-y-6">
                    <h4 className="text-lg font-semibold text-zinc-900 mb-4">Email Preferences</h4>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-zinc-900">Daily Deal Alerts</p>
                          <p className="text-sm text-zinc-500 font-medium">Best deals every day</p>
                        </div>
                        <Switch defaultSelected />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </Tab>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
