import { put, list } from "@vercel/blob"
import { createHash } from "crypto"

type AuditEvent = {
  id: string
  eventType: "upload" | "sign" | "verify" | "cert-check"
  timestamp: string
  documentUrl?: string
  signatureRecordUrl?: string
  prevHash?: string
}

function hashJson(obj: unknown): string {
  const h = createHash("sha256")
  h.update(JSON.stringify(obj))
  return h.digest("hex")
}

export async function appendAuditLog(event: Omit<AuditEvent, "id" | "timestamp" | "prevHash">) {
  // Find the latest log to compute a prevHash (tamper-evident chain)
  const prefix = "logs/"
  const { blobs } = await list({ prefix, limit: 1, cursor: undefined, mode: "folded", search: "updated" })
  const latest = blobs?.[0]
  let prevHash: string | undefined
  if (latest) {
    // Best-effort prev hash based on name+size+uploadedAt metadata
    prevHash = hashJson({ name: latest.pathname, size: latest.size, uploadedAt: latest.uploadedAt })
  }

  const entry: AuditEvent = {
    id: crypto.randomUUID(),
    eventType: event.eventType,
    timestamp: new Date().toISOString(),
    documentUrl: event.documentUrl,
    signatureRecordUrl: event.signatureRecordUrl,
    prevHash,
  }

  const pathname = `logs/${Date.now()}-${entry.id}.json`
  await put(pathname, JSON.stringify(entry, null, 2), { access: "public", contentType: "application/json" })
  return entry
}

export async function listAuditLogs() {
  const { blobs } = await list({ prefix: "logs/" })
  // Newest first
  const items = blobs
    .sort((a, b) => (b.uploadedAt ?? 0) - (a.uploadedAt ?? 0))
    .map((b) => ({
      id: b.pathname,
      eventType: "unknown",
      timestamp: new Date(b.uploadedAt ?? Date.now()).toISOString(),
      // Shallow info; full entries require fetching each blob (omitted for speed)
    }))

  // For the dashboard, also surface quick details by filename hints (optional)
  return { items }
}
