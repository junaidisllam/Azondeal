import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import fs from "fs/promises"
import path from "path"
import crypto from "crypto"
import { revalidatePath } from "next/cache"

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "categories")

async function saveFile(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null

  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = `${crypto.randomUUID()}-${file.name.replace(/\s+/g, '_')}`
    const filePath = path.join(UPLOAD_DIR, fileName)
    await fs.writeFile(filePath, buffer)
    return `/uploads/categories/${fileName}`
  } catch (error) {
    console.error("File save error:", error)
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const id = formData.get("id") as string | null
    const name = formData.get("name") as string
    const slug = formData.get("slug") as string

    // Check if slug already exists in database
    if (slug) {
      if (id) {
        const existing = await db.category.findFirst({
          where: {
            slug,
            id: { not: parseInt(id) }
          }
        })
        if (existing) {
          return NextResponse.json({
            success: false,
            error: "এই স্লাগটি পরিবর্তন করতে হবে; এটি ডেটাবেজে ইতিমধ্যে আছে।"
          }, { status: 400 })
        }
      } else {
        const existing = await db.category.findUnique({
          where: { slug }
        })
        if (existing) {
          return NextResponse.json({
            success: false,
            error: "এই স্লাগটি পরিবর্তন করতে হবে; এটি ডেটাবেজে ইতিমধ্যে আছে।"
          }, { status: 400 })
        }
      }
    }

    const parentId = formData.get("parentId") as string | null
    const searchKeyword = formData.get("searchKeyword") as string | null
    const seoTitle = formData.get("seoTitle") as string | null
    const seoDescription = formData.get("seoDescription") as string | null
    const seoKeywords = formData.get("seoKeywords") as string | null

    const imageSmallFile = formData.get("imageSmall") as File | null
    const imageMediumFile = formData.get("imageMedium") as File | null
    const imageLargeFile = formData.get("imageLarge") as File | null

    const imageSmall = await saveFile(imageSmallFile)
    const imageMedium = await saveFile(imageMediumFile)
    const imageLarge = await saveFile(imageLargeFile)

    const categoryData: any = {
      name,
      slug,
      searchKeyword,
      seoTitle,
      seoDescription,
      seoKeywords,
    }

    if (parentId) {
      categoryData.category = { connect: { id: parseInt(parentId) } }
    } else if (id) {
      categoryData.category = { disconnect: true }
    }

    if (imageSmall) categoryData.imageSmall = imageSmall
    if (imageMedium) categoryData.imageMedium = imageMedium
    if (imageLarge) categoryData.imageLarge = imageLarge

    if (id) {
      await db.category.update({
        where: { id: parseInt(id) },
        data: categoryData,
      })
    } else {
      await db.category.create({
        data: categoryData,
      })
    }

    revalidatePath("/admin/categories")
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("API Upload Error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to save category" 
    }, { status: 500 })
  }
}
