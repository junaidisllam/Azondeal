import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isAdminEmail = auth?.user?.email === "admin@azondeal.com" || auth?.user?.email === "admin@activevoucher.com"
      const isAdminRoute = nextUrl.pathname.startsWith("/admin")
      const isAdminApiRoute = nextUrl.pathname.startsWith("/api/admin")
      const isAuthRoute = nextUrl.pathname.startsWith("/auth")

      // Protected Admin API Routes - Must be logged in as admin
      if (isAdminApiRoute) {
        return isLoggedIn && isAdminEmail
      }

      // Protected Admin Frontend Routes - Handled by AdminLayout for "Security by Obscurity"
      if (isAdminRoute) {
        return true
      }

      // Auth Routes (Login) - Redirect to admin if already logged in
      if (isAuthRoute) {
        if (isLoggedIn && isAdminEmail) {
          return Response.redirect(new URL("/admin", nextUrl))
        }
        return true
      }

      return true
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub
        session.user.image = token.picture as string || session.user.image
        // @ts-ignore
        session.user.role = token.role as string || 'user'
      }
      return session
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id
        token.picture = user.image
        // @ts-ignore
        token.role = user.role
      }
      // Handle session update (if we add a way to update profile pic without re-login)
      if (trigger === "update" && session?.image) {
        token.picture = session.image
      }
      return token
    },
  },
  providers: [], // Providers are added in auth.ts to avoid Edge issues
} satisfies NextAuthConfig
