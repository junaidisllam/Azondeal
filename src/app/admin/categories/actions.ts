'use server'

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import fs from "fs/promises"
import path from "path"
import crypto from "crypto"

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "categories")

async function saveFile(file: any): Promise<string | null> {
  if (!file || typeof file === "string" || file.size === 0) return null

  try {
    // Ensure upload directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const fileName = `${crypto.randomUUID()}-${file.name}`
    const filePath = path.join(UPLOAD_DIR, fileName)
    
    await fs.writeFile(filePath, buffer)
    return `/uploads/categories/${fileName}`
  } catch (error) {
    console.error("File save error:", error)
    return null
  }
}

export async function getCategories({ query = "", page = 1, limit = 10 }: { query?: string, page?: number, limit?: number } = {}) {
  try {
    const skip = (page - 1) * limit
    const where = query ? {
      OR: [
        { name: { contains: query } },
        { slug: { contains: query } },
        { searchKeyword: { contains: query } }
      ]
    } : {}

    const [categories, total] = await Promise.all([
      db.category.findMany({
        where,
        include: {
          category: true,
          other_category: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      db.category.count({ where })
    ])

    return { categories, total }
  } catch (error) {
    console.error("Failed to fetch categories:", error)
    return { categories: [], total: 0 }
  }
}

export async function getAllCategories() {
  try {
    return await db.category.findMany({
      select: {
        id: true,
        name: true,
        parentId: true,
      },
    })
  } catch (error) {
    console.error("Failed to fetch all categories:", error)
    return []
  }
}

export async function deleteCategory(id: number) {
  try {
    await db.category.delete({
      where: { id },
    })
    revalidatePath("/admin/categories")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete category:", error)
    return { success: false, error: "Failed to delete category" }
  }
}

export async function upsertCategory(formData: FormData) {
  try {
    const id = formData.get("id") as string | null
    const name = formData.get("name") as string
    const slug = formData.get("slug") as string || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    const parentId = formData.get("parentId") as string | null
    const searchKeyword = formData.get("searchKeyword") as string | null
    const seoTitle = formData.get("seoTitle") as string | null
    const seoDescription = formData.get("seoDescription") as string | null
    const seoKeywords = formData.get("seoKeywords") as string | null

    // Handle Image Files
    const imageSmallFile = formData.get("imageSmall")
    const imageMediumFile = formData.get("imageMedium")
    const imageLargeFile = formData.get("imageLarge")

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

    // Handle parent relation
    if (parentId) {
      categoryData.category = { connect: { id: parseInt(parentId) } }
    } else if (id) {
      categoryData.category = { disconnect: true }
    }

    // Only update image if a new file was uploaded
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
    return { success: true }
  } catch (error: any) {
    console.error("FULL UPSERT ERROR:", error)
    if (error.code === 'P2002') {
      return { success: false, error: `Duplicate error: ${error.meta?.target || "Name or Slug already exists"}` }
    }
    return { success: false, error: error.message || "Failed to save category" }
  }
}
