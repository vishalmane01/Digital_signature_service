"use client"
import { useState } from "react"
import type React from "react"

import { getSupabaseBrowser } from "@/lib/supabase/browser"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const supabase = getSupabaseBrowser()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setLoading(false)
    if (error) return setError(error.message)
    router.replace("/dashboard")
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold text-primary text-balance mb-4">Welcome back</h1>
      <form onSubmit={onSubmit} className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm text-muted-foreground">Email</span>
          <input
            className="rounded-md border bg-background px-3 py-2 outline-none"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm text-muted-foreground">Password</span>
          <input
            className="rounded-md border bg-background px-3 py-2 outline-none"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        <button disabled={loading} className="rounded-md bg-primary px-3 py-2 text-primary-foreground">
          {loading ? "Signing in..." : "Sign in"}
        </button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>
      <p className="mt-4 text-sm">
        New here?{" "}
        <Link className="text-primary underline" href="/(auth)/signup">
          Create an account
        </Link>
      </p>
    </main>
  )
}
