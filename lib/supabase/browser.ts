"use client"

import { createBrowserClient } from "@supabase/ssr"

let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowser() {
  if (!browserClient) {
    browserClient = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
  }
  return browserClient
}
