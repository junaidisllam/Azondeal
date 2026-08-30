import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import AdmZip from 'adm-zip'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    console.log('[Import] Received request');
    
    // 1. Security Check (Do this first, but it shouldn't consume the stream)
    const session = await auth()
    if (!session || (session.user?.email !== 'admin@azondeal.com' && session.user?.email !== 'admin@activevoucher.com')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse FormData
    let formData;
    try {
      formData = await req.formData()
    } catch (parseError: any) {
      console.error('[Import] FormData Parse Error:', parseError);
      return NextResponse.json({ 
        error: 'Failed to parse upload data', 
        details: parseError.message || 'The file might be too large or the request was interrupted.'
      }, { status: 400 })
    }

    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'No file found in request' }, { status: 400 })
    }

    console.log(`[Import] Processing file: ${file.name} (${file.size} bytes)`);

    // 3. Prepare Temp Path
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const uploadsPath = path.join(process.cwd(), 'public', 'uploads')
    
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true })
    }

    // 4. Unzip and Overwrite
    const zip = new AdmZip(buffer)
    
    // Check if the zip contains an 'uploads/' folder at the root
    const zipEntries = zip.getEntries()
    const hasUploadsRoot = zipEntries.some(entry => entry.entryName.startsWith('uploads/'))

    console.log(`[Import] Zip structure hasUploadsRoot: ${hasUploadsRoot}`);

    if (hasUploadsRoot) {
        zip.extractAllTo(path.join(process.cwd(), 'public'), true)
    } else {
        zip.extractAllTo(uploadsPath, true)
    }

    console.log('[Import] Success');
    return NextResponse.json({ 
        success: true, 
        message: 'Uploads imported successfully. Files overwritten.' 
    })

  } catch (error: any) {
    console.error('[Import Uploads] Error:', error)
    return NextResponse.json({ 
      error: 'Failed to import uploads', 
      details: error.message 
    }, { status: 500 })
  }
}
