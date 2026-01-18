// ============================================
// File: app/dashboard/users/layout.tsx
// ============================================

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function UsersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single()

  if (
    error ||
    !profile ||
    profile.role !== "BOSS" ||
    profile.status !== "APPROVED"
  ) {
    redirect("/dashboard")
  }

  return <>{children}</>
}
