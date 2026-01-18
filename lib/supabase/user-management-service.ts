"use client"

import { createClient } from "@/lib/supabase/client"
import type { Profile, UserRole } from "@/lib/types"

const supabase = createClient()

export interface UserManagementProfile extends Profile {
  email?: string
}

export const userManagementService = {
  /**
   * Get all users (BOSS only)
   *
   * NOTE:
   * - Client cannot read auth.users
   * - Email must come from profiles table
   */
  async getAllUsers(): Promise<UserManagementProfile[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return data || []
  },

  /**
   * Get pending users (BOSS only)
   */
  async getPendingUsers(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("status", "PENDING")
      .order("created_at", { ascending: false })

    if (error) throw new Error(error.message)
    return data || []
  },

  /**
   * Approve a user (BOSS only)
   */
  async approveUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from("profiles")
      .update({
        status: "APPROVED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) throw new Error(error.message)
  },

  /**
   * Block a user (BOSS only)
   */
  async blockUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from("profiles")
      .update({
        status: "BLOCKED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) throw new Error(error.message)
  },

  /**
   * Unblock a user (BOSS only)
   */
  async unblockUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from("profiles")
      .update({
        status: "APPROVED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) throw new Error(error.message)
  },

  /**
   * Promote user role (BOSS only)
   */
  async promoteToRole(userId: string, newRole: UserRole): Promise<void> {
    const { error } = await supabase
      .from("profiles")
      .update({
        role: newRole,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) throw new Error(error.message)
  },

  /**
   * Create new user (BOSS only)
   * Uses secure server API route
   */
  async createUser(userData: {
    email: string
    password: string
    full_name: string
    role: UserRole
  }): Promise<void> {
    const response = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    })

    const json = await response.json()

    if (!response.ok) {
      throw new Error(json.error || "Failed to create user")
    }
  },

  /**
   * Check if current user is BOSS
   */
  async isBoss(): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return false

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (error) return false

    return profile.role === "BOSS"
  },

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    totalUsers: number
    pendingApprovals: number
    managers: number
    bosses: number
    blockedUsers: number
  }> {
    const { data, error } = await supabase
      .from("profiles")
      .select("role, status")

    if (error || !data) {
      return {
        totalUsers: 0,
        pendingApprovals: 0,
        managers: 0,
        bosses: 0,
        blockedUsers: 0,
      }
    }

    return {
      totalUsers: data.length,
      pendingApprovals: data.filter((p) => p.status === "PENDING").length,
      managers: data.filter((p) => p.role === "MANAGER").length,
      bosses: data.filter((p) => p.role === "BOSS").length,
      blockedUsers: data.filter((p) => p.status === "BLOCKED").length,
    }
  },
}

export default userManagementService
