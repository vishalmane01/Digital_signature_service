"use client"

import type React from "react"
import { useState } from "react"

// Utility: strip PEM headers and decode base64 to ArrayBuffer
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const clean = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "")
  const binary = atob(clean)
  const buf = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i)
  return buf.buffer
}

async function sha256OfArrayBuffer(buf: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buf)
  const bytes = new Uint8Array(digest)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

async function fetchAsArrayBuffer(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return await res.arrayBuffer()
}

async function verifyRsaPkcs1v15Sha256(
  publicKeyPem: string,
  signatureBase64: string,
  documentBytes: ArrayBuffer,
): Promise<boolean> {
  const spki = pemToArrayBuffer(publicKeyPem)
  const key = await crypto.subtle.importKey("spki", spki, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, [
    "verify",
  ])

  const sigBin = Uint8Array.from(atob(signatureBase64), (c) => c.charCodeAt(0)).buffer

  return await crypto.subtle.verify({ name: "RSASSA-PKCS1-v1_5" }, key, sigBin, documentBytes)
}

export default function VerifyToolPage() {
  const [file, setFile] = useState<File | null>(null)
  const [docUrl, setDocUrl] = useState("")
  const [publicKeyPem, setPublicKeyPem] = useState("")
  const [signatureBase64, setSignatureBase64] = useState("")
  const [hash, setHash] = useState<string>("")
  const [valid, setValid] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onVerify(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setValid(null)
    setHash("")

    try {
      let bytes: ArrayBuffer
      if (file) {
        bytes = await file.arrayBuffer()
      } else if (docUrl) {
        bytes = await fetchAsArrayBuffer(docUrl)
      } else {
        throw new Error("Provide either a file or a document URL")
      }

      const hex = await sha256OfArrayBuffer(bytes)
      setHash(hex)

      const ok = await verifyRsaPkcs1v15Sha256(publicKeyPem, signatureBase64, bytes)
      setValid(ok)
    } catch (err: any) {
      setError(err?.message || "Verification failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary text-balance">Offline Signature Verification</h1>
      </header>

      <form onSubmit={onVerify} className="flex flex-col gap-4">
        <div className="grid gap-3">
          <label className="text-sm text-muted-foreground">Document File (optional)</label>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-muted-foreground">Document URL (optional)</label>
          <input
            type="url"
            placeholder="https://blob..."
            value={docUrl}
            onChange={(e) => setDocUrl(e.target.value)}
            className="px-3 py-2 rounded border bg-background"
          />
          <p className="text-xs text-muted-foreground">Provide a file OR a URL. If both provided, the file is used.</p>
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-muted-foreground">Public Key (PEM)</label>
          <textarea
            rows={6}
            placeholder={"-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"}
            value={publicKeyPem}
            onChange={(e) => setPublicKeyPem(e.target.value)}
            className="px-3 py-2 rounded border bg-background font-mono text-sm"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-muted-foreground">Signature (Base64)</label>
          <textarea
            rows={3}
            placeholder={"BASE64_SIGNATURE"}
            value={signatureBase64}
            onChange={(e) => setSignatureBase64(e.target.value)}
            className="px-3 py-2 rounded border bg-background font-mono text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="self-start px-4 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Verifying..." : "Verify"}
        </button>
      </form>

      <section className="grid gap-2">
        {hash && (
          <div className="text-sm">
            Computed SHA-256: <span className="font-mono">{hash}</span>
          </div>
        )}
        {valid !== null && (
          <div className={`text-sm font-medium ${valid ? "text-green-600" : "text-destructive"}`}>
            Result: {valid ? "Valid signature" : "Invalid signature"}
          </div>
        )}
        {error && <div className="text-sm text-destructive">Error: {error}</div>}
      </section>
    </main>
  )
}
