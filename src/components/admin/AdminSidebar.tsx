'use client'
import React, { useState } from 'react'
import { Menu, X, LogOut } from 'lucide-react'
import { Button, Drawer, DrawerContent, DrawerBody } from '@heroui/react'
import AdminNav from './AdminNav'
import { signOut } from 'next-auth/react'

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleSidebar = () => setIsOpen(!isOpen)
  const closeSidebar = () => setIsOpen(false)

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-zinc-100 flex items-center justify-between px-6 z-40">
        <div className="flex items-center gap-3">
           <img src="/logo.png" alt="Logo" className="h-7 w-auto object-contain" />
           <div className="h-5 w-[1px] bg-zinc-100" />
           <span className="font-black text-zinc-900 tracking-tighter text-sm uppercase">Admin</span>
        </div>
        <Button 
          isIconOnly 
          variant="ghost" 
          onPress={toggleSidebar}
          className="text-zinc-600"
        >
          <Menu size={24} />
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-zinc-100 flex-col sticky top-0 h-screen">
        <AdminNav />
        <div className="p-4 border-t border-zinc-50">
          <Button
            variant="ghost"
            fullWidth
            onPress={() => signOut()}
            className="flex items-center justify-start gap-3 px-4 py-6 rounded-2xl text-[14px] font-bold text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={20} />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      <Drawer 
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      >
        <DrawerContent placement="left" className="bg-white w-[280px] z-[100]">
          <DrawerBody className="p-0 h-full overflow-hidden bg-white">
            <AdminNav onClose={closeSidebar} />
            <div className="p-4 border-t border-zinc-50 mt-auto bg-white">
              <Button
                variant="ghost"
                fullWidth
                onPress={() => signOut()}
                className="flex items-center justify-start gap-3 px-4 py-6 rounded-2xl text-[14px] font-bold text-red-500 hover:bg-red-50 transition-all"
              >
                <LogOut size={20} />
                Logout
              </Button>
            </div>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}
