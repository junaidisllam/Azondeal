import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import AdmZip from 'adm-zip'
import { auth } from '@/auth'

export async function GET() {
  try {
    // 1. Security Check: Only admins can export
    const session = await auth()
    if (!session || (session.user?.email !== 'admin@azondeal.com' && session.user?.email !== 'admin@activevoucher.com')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const uploadsPath = path.join(process.cwd(), 'public', 'uploads')

    // 2. Check if uploads folder exists
    if (!fs.existsSync(uploadsPath)) {
      return NextResponse.json({ error: 'Uploads folder not found' }, { status: 404 })
    }

    // 3. Create Zip
    const zip = new AdmZip()
    
    // Add the entire uploads directory to the zip
    // The second argument is the name of the folder within the zip
    zip.addLocalFolder(uploadsPath, 'uploads')

    const zipBuffer = zip.toBuffer()

    // 4. Return as downloadable file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `uploads-backup-${timestamp}.zip`

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error: any) {
    console.error('[Export Uploads] Error:', error)
    return NextResponse.json({ 
      error: 'Failed to create export', 
      details: error.message 
    }, { status: 500 })
  }
}
