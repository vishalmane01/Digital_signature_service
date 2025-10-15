"use client"
import { useState } from "react"
import type React from "react"

import { getSupabaseBrowser } from "@/lib/supabase/browser"
import Link from "next/link"

export default function SignupPage() {
  const supabase = getSupabaseBrowser()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
      },
    })
    setLoading(false)
    if (error) return setError(error.message)
    setMessage("Check your email to confirm your account.")
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold text-primary text-balance mb-4">Create an account</h1>
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
            autoComplete="new-password"
          />
        </label>
        <button disabled={loading} className="rounded-md bg-primary px-3 py-2 text-primary-foreground">
          {loading ? "Creating..." : "Sign up"}
        </button>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}
      </form>
      <p className="mt-4 text-sm">
        Already have an account?{" "}
        <Link className="text-primary underline" href="/(auth)/login">
          Sign in
        </Link>
      </p>
    </main>
  )
}
