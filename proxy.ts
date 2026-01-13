import { updateSession } from "@/lib/supabase/proxy"
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Only match API routes and auth routes for session updates
    "/api/:path*",
    "/auth/:path*",
    "/dashboard/:path*",
  ],
}
