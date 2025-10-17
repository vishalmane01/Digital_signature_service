"use client"
import useSWR from "swr"
import { useState } from "react"

type Doc = { id: string; filename: string; url: string }
const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function SignDocument() {
  const { data } = useSWR<{ documents: Doc[] }>("/api/documents/list", fetcher)
  const [docUrl, setDocUrl] = useState<string>("")
  const [privateKeyPem, setPrivateKeyPem] = useState<string>("")
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus(null)
    setError(null)
    const res = await fetch("/api/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentUrl: docUrl, certificateChainPem: [] }),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json?.error || "Failed to sign")
      return
    }
    setStatus("Signature created: " + json.signatureBase64.slice(0, 16) + "...")
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <label>
        Document
        <select value={docUrl} onChange={(e) => setDocUrl(e.target.value)} required>
          <option value="" disabled>Select document</option>
          {data?.documents?.map((d) => (
            <option key={d.id} value={d.url}>{d.filename}</option>
          ))}
        </select>
      </label>
      <label>
        Private Key PEM
        <textarea
          placeholder="-----BEGIN PRIVATE KEY-----"
          value={privateKeyPem}
          onChange={(e) => setPrivateKeyPem(e.target.value)}
        />
      </label>
      <button>Generate signature</button>
      {status && <p className="text-green-600">{status}</p>}
      {error && <p className="text-red-600">{error}</p>}
    </form>
  )
}
