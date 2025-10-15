"use client"
import useSWR from "swr"
import type React from "react"

import { useState } from "react"

type Doc = { id: string; filename: string }
const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function SignDocument() {
  const { data } = useSWR<{ documents: Doc[] }>("/api/documents/list", fetcher)
  const [docId, setDocId] = useState<string>("")
  const [privateKeyPem, setPrivateKeyPem] = useState<string>("")
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus(null)
    setError(null)
    const res = await fetch("/api/signatures/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: docId, privateKeyPem }),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json?.error || "Failed to sign")
      return
    }
    setStatus("Signature created: " + json.signature.slice(0, 16) + "...")
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <label className="grid gap-2">
        <span className="text-sm">Document</span>
        <select
          className="rounded-md border bg-background px-3 py-2"
          required
          value={docId}
          onChange={(e) => setDocId(e.target.value)}
        >
          <option value="" disabled>
            Select document
          </option>
          {data?.documents?.map((d) => (
            <option key={d.id} value={d.id}>
              {d.filename}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2">
        <span className="text-sm">Private key (PEM)</span>
        <textarea
          className="min-h-32 rounded-md border bg-background p-2 font-mono text-xs"
          placeholder="-----BEGIN PRIVATE KEY-----"
          value={privateKeyPem}
          onChange={(e) => setPrivateKeyPem(e.target.value)}
        />
      </label>
      <button className="rounded-md bg-primary px-3 py-2 text-primary-foreground">Generate signature</button>
      <p className="text-xs text-muted-foreground">
        For demo use only. Your private key is not stored; it is used only for this request.
      </p>
      {status && <p className="text-sm text-green-600">{status}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  )
}
