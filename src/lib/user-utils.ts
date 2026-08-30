import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'profiles')

try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  }
} catch (error) {
  console.error('Failed to create upload directory:', error)
}

/**
 * Downloads an image from a URL and saves it locally.
 * Optimized to prevent "429 Too Many Requests" by checking local cache first.
 */
export async function saveProfileImage(url: string, userId: string): Promise<string> {
  // Use a predictable filename for each user to cache correctly
  const fileName = `${userId}-profile.jpg`
  const filePath = path.join(UPLOAD_DIR, fileName)
  const publicPath = `/uploads/profiles/${fileName}`

  try {
    // 1. Check if the file already exists locally
    if (fs.existsSync(filePath)) {
      // Optional: Check file age or size, but for now just return the local path
      const stats = fs.statSync(filePath)
      if (stats.size > 0) {
        return publicPath
      }
    }

    // 2. If not exists or empty, download it
    const response = await fetch(url)
    
    if (response.status === 429) {
      return url // Return original URL if rate limited, maybe browser can still load it
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    fs.writeFileSync(filePath, buffer)

    return publicPath
  } catch (error) {
    console.error(`[Storage] Error saving profile image for ${userId}:`, error)
    return url // Fallback to original URL
  }
}

/**
 * Generates a Gravatar URL for a given email.
 */
export function getGravatarUrl(email: string): string {
  const hash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex')
  return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=200`
}
