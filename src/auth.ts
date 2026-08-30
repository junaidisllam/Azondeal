import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"
import { saveProfileImage, getGravatarUrl } from "@/lib/user-utils"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: { 
    strategy: "jwt",
  },
  events: {
    async createUser({ user }) {
      if (user.email && !user.image) {
        try {
          const gravatarUrl = getGravatarUrl(user.email)
          await db.user.update({
            where: { id: user.id },
            data: { image: gravatarUrl }
          })
        } catch (error) {
          console.error("[Auth] Failed to assign Gravatar:", error)
        }
      }
    },
    async signIn({ user, account, profile }) {
      // Setting cookies directly in events can fail during GET callbacks in Next.js 15+
      /*
      if (typeof window === 'undefined') {
        try {
          const { cookies } = await import('next/headers')
          const cookieStore = await cookies()
          cookieStore.set('is-auth', 'true', { 
            maxAge: 30 * 24 * 60 * 60, // 30 days
            path: '/',
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production'
          })
        } catch (e) {
          console.error("[Auth] Failed to set auth cookie:", e)
        }
      }
      */
      
      if (user.id) {
        try {
          const imageUrl = (profile?.picture as string) || user.image
          if (imageUrl && !imageUrl.startsWith('/uploads/')) {
            const localPath = await saveProfileImage(imageUrl, user.id)
            if (localPath.startsWith('/uploads/')) {
              await db.user.update({
                where: { id: user.id },
                data: { image: localPath }
              })
              user.image = localPath
            }
          }
        } catch (error) {
          console.error("[Auth] Localization error:", error)
        }
      }
    }
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      checks: ['state'], // Bypass PKCE code_verifier issues in some proxy environments
    }),
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          // 1. Try to find in admin table first
          const admin = await db.admin.findUnique({
            where: { email: credentials.email as string },
          })

          if (admin && admin.password) {
            const isPasswordCorrect = await bcrypt.compare(
              credentials.password as string,
              admin.password
            )

            if (isPasswordCorrect) {
              return {
                id: admin.id.toString(),
                email: admin.email,
                name: admin.name,
                role: 'admin'
              }
            }
          }

          // 2. Try to find in user table
          const user = await db.user.findUnique({
            where: { email: credentials.email as string },
          })

          if (user && user.password) {
            const isPasswordCorrect = await bcrypt.compare(
              credentials.password as string,
              user.password
            )

            if (isPasswordCorrect) {
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
                role: user.role
              }
            }
          }

          return null
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
})
