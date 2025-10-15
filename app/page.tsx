"use client"

import type React from "react"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

type UploadResponse = { url: string; pathname: string; hashHex: string; size: number }
type SignResponse = {
  documentUrl: string
  documentHashHex: string
  algorithm: string
  signatureBase64: string
  publicKeyPem?: string
  certificateChainPem?: string[]
  timestampTokenBase64?: string
  signatureRecordUrl?: string
}
type VerifyResponse = {
  ok: boolean
  reason?: string
  documentHashHex?: string
  signatureAlgorithm?: string
  certificate?: { subject?: string; issuer?: string }
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-6">
        <h1 className="text-balance text-4xl font-semibold text-primary">Digital Signature Service</h1>
        <p className="text-muted-foreground mt-2">
          Upload, sign, and verify documents. This scaffold uses Vercel Blob for storage with stubs for KMS, TSA, and
          certificate validation.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          Ocean theme active
        </div>
      </header>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid grid-cols-4 rounded-lg bg-muted p-1">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="sign">Sign</TabsTrigger>
          <TabsTrigger value="verify">Verify</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <UploadPanel />
        </TabsContent>

        <TabsContent value="sign">
          <SignPanel />
        </TabsContent>

        <TabsContent value="verify">
          <VerifyPanel />
        </TabsContent>

        <TabsContent value="logs">
          <LogsPanel />
        </TabsContent>
      </Tabs>
    </main>
  )
}

function UploadPanel() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<UploadResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = (await res.json()) as UploadResponse
      setResult(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload a Document</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <Input
            type="file"
            accept=".pdf,.txt,.doc,.docx,.png,.jpg,.jpeg"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <Button type="submit" disabled={!file || loading} className={cn(loading && "opacity-70")}>
            {loading ? "Uploading..." : "Upload"}
          </Button>
        </form>
        {result && (
          <div className="text-sm">
            <div>
              <span className="font-medium">URL:</span> {result.url}
            </div>
            <div>
              <span className="font-medium">Hash (SHA-256):</span> {result.hashHex}
            </div>
            <div>
              <span className="font-medium">Size:</span> {result.size} bytes
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SignPanel() {
  const [documentUrl, setDocumentUrl] = useState("")
  const [certChainPem, setCertChainPem] = useState("") // optional multiline
  const [result, setResult] = useState<SignResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        documentUrl,
        certificateChainPem: certChainPem
          .split("\n")
          .map((l) => l.trim())
          .join("\n")
          .split("-----END CERTIFICATE-----")
          .map((p) => p.trim())
          .filter(Boolean)
          .map((p) => (p.endsWith("END CERTIFICATE-----") ? p : p + "\n-----END CERTIFICATE-----")),
      }
      const res = await fetch("/api/sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = (await res.json()) as SignResponse
      setResult(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Digitally Sign Document</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <Input
            placeholder="Document URL (from Upload step)"
            value={documentUrl}
            onChange={(e) => setDocumentUrl(e.target.value)}
          />
          <Textarea
            placeholder="Optional: Certificate Chain (PEM, concatenated)"
            className="min-h-32"
            value={certChainPem}
            onChange={(e) => setCertChainPem(e.target.value)}
          />
          <Button type="submit" disabled={!documentUrl || loading} className={cn(loading && "opacity-70")}>
            {loading ? "Signing..." : "Sign"}
          </Button>
        </form>
        {result && (
          <div className="text-sm space-y-2">
            <div>
              <span className="font-medium">Doc Hash:</span> {result.documentHashHex}
            </div>
            <div>
              <span className="font-medium">Algorithm:</span> {result.algorithm}
            </div>
            <div className="break-all">
              <span className="font-medium">Signature (base64):</span> {result.signatureBase64}
            </div>
            {result.publicKeyPem && (
              <details className="mt-2">
                <summary className="cursor-pointer underline">Public Key (PEM)</summary>
                <pre className="overflow-auto rounded-md bg-muted p-2 text-xs">{result.publicKeyPem}</pre>
              </details>
            )}
            {!!result.certificateChainPem?.length && (
              <details className="mt-2">
                <summary className="cursor-pointer underline">Certificate Chain</summary>
                <pre className="overflow-auto rounded-md bg-muted p-2 text-xs">
                  {result.certificateChainPem.join("\n\n")}
                </pre>
              </details>
            )}
            {result.timestampTokenBase64 && (
              <div className="break-all">
                <span className="font-medium">Timestamp Token:</span> {result.timestampTokenBase64}
              </div>
            )}
            {result.signatureRecordUrl && (
              <div>
                <span className="font-medium">Signature Record:</span> {result.signatureRecordUrl}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function VerifyPanel() {
  const [documentUrl, setDocumentUrl] = useState("")
  const [signatureBase64, setSignatureBase64] = useState("")
  const [publicKeyPem, setPublicKeyPem] = useState("")
  const [result, setResult] = useState<VerifyResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { documentUrl, signatureBase64, publicKeyPem }
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = (await res.json()) as VerifyResponse
      setResult(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify Signature</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <Input placeholder="Document URL" value={documentUrl} onChange={(e) => setDocumentUrl(e.target.value)} />
          <Textarea
            placeholder="Signature (base64)"
            value={signatureBase64}
            onChange={(e) => setSignatureBase64(e.target.value)}
          />
          <Textarea
            placeholder="Public Key (PEM) — optional if KMS/cert is configured"
            value={publicKeyPem}
            onChange={(e) => setPublicKeyPem(e.target.value)}
          />
          <Button
            type="submit"
            disabled={!documentUrl || !signatureBase64 || loading}
            className={cn(loading && "opacity-70")}
          >
            {loading ? "Verifying..." : "Verify"}
          </Button>
        </form>
        {result && (
          <div className={cn("text-sm font-medium", result.ok ? "text-green-600" : "text-destructive")}>
            {result.ok ? "Verification successful." : `Verification failed${result.reason ? `: ${result.reason}` : ""}`}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function LogsPanel() {
  const { data, isLoading } = useSWR<{ items: any[] }>("/api/logs", fetcher)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <div className="text-sm text-muted-foreground">Loading logs…</div>}
        {!isLoading &&
          (!data?.items?.length ? (
            <div className="text-sm text-muted-foreground">No logs yet.</div>
          ) : (
            <div className="space-y-2">
              {data.items.map((log: any) => (
                <div key={log.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{log.eventType}</span>
                    <span className="text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  {log.documentUrl && <div className="break-all">Doc: {log.documentUrl}</div>}
                  {log.signatureRecordUrl && (
                    <div className="break-all">Signature Record: {log.signatureRecordUrl}</div>
                  )}
                  {log.prevHash && (
                    <div className="break-all text-xs text-muted-foreground">Prev Hash: {log.prevHash}</div>
                  )}
                </div>
              ))}
            </div>
          ))}
      </CardContent>
    </Card>
  )
}
