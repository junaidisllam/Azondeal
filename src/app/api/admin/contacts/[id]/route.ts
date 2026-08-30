import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    
    await db.contactmessage.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Message deleted successfully' })
  } catch (error: any) {
    console.error('Delete Contact Error:', error)
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 })
  }
}
