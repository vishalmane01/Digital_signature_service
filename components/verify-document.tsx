"use client"
import useSWR from "swr"
import type React from "react"

import { useState } from "react"

type Doc = { id: string; filename: string }
const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function VerifyDocument() {
  const { data } = useSWR<{ documents: Doc[] }>("/api/documents/list", fetcher)
  const [docId, setDocId] = useState<string>("")
  const [publicKeyPem, setPublicKeyPem] = useState<string>("")
  const [signatureBase64, setSignatureBase64] = useState<string>("")
  const [result, setResult] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: docId, publicKeyPem, signatureBase64 }),
    })
    const json = await res.json()
    setResult(res.ok ? (json.valid ? "Valid" : "Invalid") : json?.error || "Error")
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
        <span className="text-sm">Public key (PEM)</span>
        <textarea
          className="min-h-32 rounded-md border bg-background p-2 font-mono text-xs"
          placeholder="-----BEGIN PUBLIC KEY-----"
          value={publicKeyPem}
          onChange={(e) => setPublicKeyPem(e.target.value)}
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm">Signature (base64)</span>
        <textarea
          className="min-h-24 rounded-md border bg-background p-2 font-mono text-xs"
          placeholder="base64 signature"
          value={signatureBase64}
          onChange={(e) => setSignatureBase64(e.target.value)}
        />
      </label>
      <button className="rounded-md border px-3 py-2">Verify</button>
      {result && <p className="text-sm">{result}</p>}
    </form>
  )
}
