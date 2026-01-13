import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const userMetadata = user.user_metadata as { full_name?: string; role?: string }

  return (
    <div className="min-h-screen notebook-bg">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <DashboardHeader
          userName={userMetadata?.full_name || user.email?.split("@")[0] || "User"}
          userRole={userMetadata?.role || "USER"}
        />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
