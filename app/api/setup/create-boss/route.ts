import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, full_name } = body

    if (!email || !password) {
      return NextResponse.json({ error: "email and password required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Check if a BOSS already exists
    const { data: existingBoss } = await supabase.from("profiles").select("id").eq("role", "BOSS").limit(1).maybeSingle()
    if (existingBoss) {
      return NextResponse.json({ error: "Boss account already exists" }, { status: 400 })
    }

    // Create user via admin API
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name, role: "BOSS", status: "APPROVED" },
      email_confirm: true,
    } as any)

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    // Insert profile row
    const userId = (userData as any)?.user?.id || (userData as any)?.id
    if (userId) {
      await supabase.from("profiles").insert({ id: userId, full_name, role: "BOSS", status: "APPROVED" })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
