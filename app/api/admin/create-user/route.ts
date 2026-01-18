import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    // ─────────────────────────────────────────────
    // 1️⃣ Verify requesting user is BOSS
    // ─────────────────────────────────────────────
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Auth error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile, error: profileCheckError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileCheckError || profile?.role !== "BOSS") {
      console.error("Profile check error:", profileCheckError)
      return NextResponse.json(
        { error: "Forbidden: Only BOSS can create users" },
        { status: 403 }
      )
    }

    // ─────────────────────────────────────────────
    // 2️⃣ Parse & validate body
    // ─────────────────────────────────────────────
    const { email, password, full_name, role } = await request.json()

    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, full_name, role" },
        { status: 400 }
      )
    }

    if (role !== "MANAGER" && role !== "BOSS") {
      return NextResponse.json(
        { error: "Role must be MANAGER or BOSS" },
        { status: 400 }
      )
    }

    // ─────────────────────────────────────────────
    // 3️⃣ Create user via admin client
    // ─────────────────────────────────────────────
    const adminClient = createAdminClient()

    console.log("Creating auth user...")
    const { data: userData, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          role,
          status: "APPROVED",
        },
      })

    if (createError || !userData.user?.id) {
      console.error("Create user error:", createError)
      return NextResponse.json(
        { error: createError?.message || "Failed to create user" },
        { status: 500 }
      )
    }

    const newUserId = userData.user.id
    console.log("Auth user created:", newUserId)

    // ─────────────────────────────────────────────
    // 4️⃣ Check if profile already exists (from previous failed attempt)
    // ─────────────────────────────────────────────
    console.log("Checking for existing profile...")
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("id", newUserId)
      .single()

    if (existingProfile) {
      console.log("Profile already exists, updating instead...")
      const { error: updateError } = await adminClient
        .from("profiles")
        .update({
          full_name,
          role,
          status: "APPROVED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", newUserId)

      if (updateError) {
        console.error("Profile update error:", updateError)
        return NextResponse.json(
          { error: `Failed to update existing profile: ${updateError.message}` },
          { status: 500 }
        )
      }
      
      console.log("Profile updated successfully")
    } else {
      // ─────────────────────────────────────────────
      // 5️⃣ Create new profile
      // ─────────────────────────────────────────────
      console.log("Creating new profile...")
      
      const profileData: any = {
        id: newUserId,
        full_name,
        role,
        status: "APPROVED",
      }

      const { data: insertedProfile, error: profileError } = await adminClient
        .from("profiles")
        .insert(profileData)
        .select()
        .single()

      if (profileError) {
        console.error("Profile creation error:", profileError)
        console.error("Profile data attempted:", profileData)

        // Rollback: Delete the auth user
        console.log("Rolling back auth user...")
        await adminClient.auth.admin.deleteUser(newUserId)

        return NextResponse.json(
          { 
            error: `Failed to create user profile: ${profileError.message}`,
            details: profileError 
          },
          { status: 500 }
        )
      }

      console.log("Profile created successfully:", insertedProfile)
    }

    // ─────────────────────────────────────────────
    // 6️⃣ Success
    // ─────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      user: {
        id: newUserId,
        email,
        full_name,
        role,
      },
    })
  } catch (err: any) {
    console.error("Unexpected error:", err)
    return NextResponse.json(
      { error: err?.message || "Internal Server Error", details: err },
      { status: 500 }
    )
  }
}