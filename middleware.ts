import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    // Optionally log for diagnostics; safe to remove later
    // console.log("[v0] Supabase env vars not set; skipping auth refresh in middleware.")
    return res
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options)
        })
      },
    },
  })

  // Refresh if needed
  await supabase.auth.getUser().catch(() => {})
  return res
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
}
