import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { name, email, subject, message } = data

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const newMessage = await db.contactmessage.create({
      data: {
        name,
        email,
        subject,
        message
      }
    })

    return NextResponse.json({ success: true, message: newMessage })
  } catch (error: any) {
    console.error('Contact API Error:', error)
    return NextResponse.json({ 
      error: 'Failed to send message', 
      details: error.message || String(error) 
    }, { status: 500 })
  }
}
