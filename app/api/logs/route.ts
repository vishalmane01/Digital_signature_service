import { NextResponse } from "next/server"
import { list } from "@vercel/blob"

export async function GET() {
  try {
    const { blobs } = await list({ prefix: "logs/" })
    const items = blobs
      .sort((a, b) => (b.uploadedAt ?? 0) - (a.uploadedAt ?? 0))
      .map((b) => ({
        id: b.pathname,
        eventType: b.pathname.includes("/signatures/") ? "sign" : "upload",
        timestamp: new Date(b.uploadedAt ?? Date.now()).toISOString(),
        documentUrl: undefined as string | undefined,
        signatureRecordUrl: undefined as string | undefined,
        prevHash: undefined as string | undefined,
      }))

    return NextResponse.json({ items })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "failed to list logs" }, { status: 500 })
  }
}
