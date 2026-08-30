import React from "react"
import { auth } from "@/auth"
import AdminSidebar from "@/components/admin/AdminSidebar"
import AdminForbidden from "@/components/admin/AdminForbidden"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const isAdmin = session?.user?.email === "admin@azondeal.com" || session?.user?.email === "admin@activevoucher.com"

  if (!isAdmin) {
    return <AdminForbidden />
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-8">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Welcome back</h2>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900">{session.user?.name || "Admin"}</h1>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white border border-zinc-100 shadow-sm flex items-center justify-center text-zinc-900 font-black uppercase tracking-tighter text-sm sm:text-base">
                  {session.user?.name?.substring(0, 2) || "AD"}
               </div>
            </div>
          </header>
          {children}
        </div>
      </main>
    </div>
  )
}
