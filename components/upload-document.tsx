"use client"
import { useState } from "react"
import type React from "react"

export default function UploadDocument() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus(null)
    setError(null)
    if (!file) return
    const form = new FormData()
    form.append("file", file)
    const res = await fetch("/api/documents/upload", { method: "POST", body: form })
    const json = await res.json()
    if (!res.ok) {
      setError(json?.error || "Upload failed")
      return
    }
    setStatus("Uploaded!")
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
      <button className="rounded-md bg-primary px-3 py-2 text-primary-foreground">Upload</button>
      {status && <p className="text-sm text-green-600">{status}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  )
}
