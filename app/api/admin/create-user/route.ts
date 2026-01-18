import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    // ─────────────────────────────────────────────
    // 1️⃣ Verify requesting user
    // ─────────────────────────────────────────────
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ─────────────────────────────────────────────
    // 2️⃣ Verify BOSS role
    // ─────────────────────────────────────────────
    const { data: profile, error: profileCheckError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileCheckError || profile?.role !== "BOSS") {
      return NextResponse.json(
        { error: "Forbidden: Only BOSS can create users" },
        { status: 403 }
      )
    }

    // ─────────────────────────────────────────────
    // 3️⃣ Parse & validate body
    // ─────────────────────────────────────────────
    const { email, password, full_name, role } = await request.json()

    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
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
    // 4️⃣ Create user via admin client
    // ─────────────────────────────────────────────
    const adminClient = createAdminClient()

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

    // ─────────────────────────────────────────────
    // 5️⃣ Create profile
    // ─────────────────────────────────────────────
    const { error: profileError } = await adminClient
      .from("profiles")
      .insert({
        id: newUserId,
        email,
        full_name,
        role,
        status: "APPROVED",
      })

    if (profileError) {
      console.error("Profile creation error:", profileError)

      // Rollback auth user
      await adminClient.auth.admin.deleteUser(newUserId)

      return NextResponse.json(
        { error: "Failed to create user profile" },
        { status: 500 }
      )
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
      { error: err?.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}
