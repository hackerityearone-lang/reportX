// File: app/dashboard/layout.tsx

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
    console.log("No user or auth error, redirecting to login")
    redirect("/auth/login")
  }

  console.log("User authenticated:", user.id)

  // Fetch profile from the database to get role and status (server-side enforcement)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role, status")
    .eq("id", user.id)
    .single()

  // If no profile exists, redirect to login
  if (profileError || !profile) {
    console.error("Profile fetch error:", profileError)
    console.log("Redirecting to login - no profile found")
    redirect("/auth/login")
  }

  console.log("Profile loaded:", profile)

  // Check if user is approved - only allow if status is explicitly "APPROVED"
  if (profile.status !== "APPROVED") {
    console.log("User status:", profile.status)
    // Redirect to pending approval page instead of login
    if (profile.status === "PENDING") {
      redirect("/auth/pending")
    }
    // If blocked or any other status, redirect to login
    console.log("Redirecting to login - status not approved")
    redirect("/auth/login")
  }

  console.log("User approved, loading dashboard")

  const userMetadata = {
    full_name: profile.full_name,
    role: profile.role,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Subtle pattern overlay */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.05),transparent_50%)] pointer-events-none" />
      
      <DashboardSidebar userRole={userMetadata.role || "MANAGER"} />
      
      <div className="lg:pl-72">
        <DashboardHeader
          userName={userMetadata?.full_name || user.email?.split("@")[0] || "User"}
          userRole={userMetadata?.role || "MANAGER"}
        />
        
        {/* Main Content Area */}
        <main className="relative min-h-[calc(100vh-4rem)] px-4 lg:px-6 pt-20 pb-28 lg:pt-6 lg:pb-6">
          {/* Content wrapper with subtle card effect */}
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
        
        {/* Footer - Desktop only */}
        <footer className="hidden lg:block border-t border-emerald-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <p>© 2025 Stock Manager. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Help
                </a>
                <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Privacy
                </a>
                <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Terms
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}