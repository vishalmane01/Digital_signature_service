import { cookies, headers } from "next/headers"
import { createServerClient } from "@supabase/ssr"

let serverClient: ReturnType<typeof createServerClient> | null = null

export function getSupabaseServer() {
  if (!serverClient) {
    serverClient = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      cookies: {
        getAll() {
          return cookies().getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookies().set(name, value, options))
          } catch {
            // ignore in RSC
          }
        },
      },
      headers: {
        get(key: string) {
          return headers().get(key) ?? undefined
        },
      },
    })
  }
  return serverClient
}
