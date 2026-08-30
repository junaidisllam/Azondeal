import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'

async function saveImage(file: string | File | null, prefix: string) {
  if (!file) return ''
  
  // If it's already a URL string, return it
  if (typeof file === 'string') {
    if (!file.startsWith('data:image/')) return file
    
    // Handle Base64
    const matches = file.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/)
    if (!matches || matches.length !== 3) return file
    
    const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1]
    const data = Buffer.from(matches[2], 'base64')
    const filename = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'hero')
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    
    const filepath = path.join(uploadDir, filename)
    fs.writeFileSync(filepath, data)
    return `/uploads/hero/${filename}`
  }

  // Handle File object from FormData
  const bytes = await (file as File).arrayBuffer()
  const buffer = Buffer.from(bytes)
  
  const extension = (file as File).name.split('.').pop() || 'jpg'
  const filename = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'hero')
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }
  
  const filepath = path.join(uploadDir, filename)
  fs.writeFileSync(filepath, buffer)
  
  return `/uploads/hero/${filename}`
}

async function deleteFile(fileUrl: string) {
  if (!fileUrl || !fileUrl.startsWith('/uploads/')) return
  
  try {
    const filepath = path.join(process.cwd(), 'public', fileUrl)
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath)
    }
  } catch (err) {
    console.error('Failed to delete file:', fileUrl, err)
  }
}

export async function GET() {
  try {
    const slides = await db.heroslide.findMany({
      orderBy: { order: 'asc' }
    })
    return NextResponse.json(slides)
  } catch (error: any) {
    console.error('Hero GET Error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch slides',
      details: error.message || String(error)
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    
    const id = formData.get('id') as string | null
    const alt = formData.get('alt') as string || ''
    const order = formData.get('order') as string || '0'
    const link = formData.get('link') as string || ''
    
    const desktop = formData.get('desktop') as File | string | null
    const mobile = formData.get('mobile') as File | string | null

    console.log(`[Hero API] Processing POST for slide ID: ${id || 'NEW'}`)

    let desktopPath = ''
    let mobilePath = ''

    if (id) {
      const existing = await db.heroslide.findUnique({ where: { id: Number(id) } })
      if (!existing) {
        return NextResponse.json({ error: 'Slide not found' }, { status: 404 })
      }
      
      desktopPath = existing.desktop
      mobilePath = existing.mobile

      // Only update and delete old if a NEW file/base64 is provided
      if (desktop && (desktop instanceof File || (typeof desktop === 'string' && desktop.startsWith('data:image/')))) {
        await deleteFile(existing.desktop)
        desktopPath = await saveImage(desktop, 'desktop')
      }
      
      if (mobile && (mobile instanceof File || (typeof mobile === 'string' && mobile.startsWith('data:image/')))) {
        await deleteFile(existing.mobile)
        mobilePath = await saveImage(mobile, 'mobile')
      }

      const slide = await db.heroslide.update({
        where: { id: Number(id) },
        data: { 
          desktop: desktopPath, 
          mobile: mobilePath, 
          alt, 
          order: Number(order),
          link
        }
      })
      return NextResponse.json(slide)
    } else {
      // Create new
      desktopPath = await saveImage(desktop, 'desktop')
      mobilePath = await saveImage(mobile, 'mobile')

      const slide = await db.heroslide.create({
        data: { 
          desktop: desktopPath, 
          mobile: mobilePath, 
          alt, 
          order: Number(order),
          link
        }
      })
      return NextResponse.json(slide)
    }
  } catch (error: any) {
    console.error('Hero POST Error FULL:', error)
    return NextResponse.json({ 
      error: 'Failed to save slide', 
      details: error.message || String(error)
    }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    // Delete files first
    const existing = await db.heroslide.findUnique({ where: { id: Number(id) } })
    if (existing) {
      await deleteFile(existing.desktop)
      await deleteFile(existing.mobile)
    }

    await db.heroslide.delete({
      where: { id: Number(id) }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Hero DELETE Error:', error)
    return NextResponse.json({ error: 'Failed to delete slide' }, { status: 500 })
  }
}
