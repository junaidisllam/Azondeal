import React from 'react'
import { db } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Button } from '@heroui/button'
import { ChevronLeft, Mail, User, MessageSquare, Calendar, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default async function ContactDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const messageId = parseInt(id)

  if (isNaN(messageId)) {
    notFound()
  }

  const message = await db.contactmessage.findUnique({
    where: { id: messageId }
  })

  if (!message) {
    notFound()
  }

  async function deleteMessage() {
    'use server'
    await db.contactmessage.delete({ where: { id: message!.id } })
    redirect('/admin/contacts')
  }

  return (
    <div className="max-w-[800px] mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/admin/contacts">
          <Button variant="ghost" className="font-bold text-zinc-500 hover:text-primary transition-colors">
            <ChevronLeft size={20} className="mr-1" />
            Back to Messages
          </Button>
        </Link>
        
        <form action={deleteMessage}>
          <Button type="submit" variant="ghost" className="font-bold text-danger hover:bg-danger-50">
            <Trash2 size={18} className="mr-2" />
            Delete Message
          </Button>
        </form>
      </div>

      <Card className="bg-white border border-zinc-100 shadow-2xl rounded-[3rem] overflow-hidden">
        <CardHeader className="bg-zinc-50/50 p-8 border-b border-zinc-100 flex flex-col items-start gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <Mail size={32} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-1">Subject</h2>
              <h1 className="text-2xl font-black text-zinc-900 leading-tight">{message.subject}</h1>
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-8 sm:p-12 space-y-10">
          {/* Metadata Grid */}
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400">
                <User size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Sender Name</p>
                <p className="font-black text-zinc-900">{message.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400">
                <Mail size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Email Address</p>
                <p className="font-black text-zinc-900">{message.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Received On</p>
                <p className="font-black text-zinc-900">
                  {message.createdAt.toLocaleDateString()} at {message.createdAt.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-10">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare size={18} className="text-primary" />
              <h3 className="text-lg font-black text-zinc-900">Message Content</h3>
            </div>
            <div className="bg-zinc-50 p-8 rounded-[2rem] text-zinc-700 leading-relaxed font-medium whitespace-pre-wrap">
              {message.message}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
